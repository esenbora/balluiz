import { PlayerSeed } from '../data/players';
import { ALL_PLAYERS, GamePlayer } from '../data';
import { CLUBS, NATIONS, clubById, nationById } from '../data/clubs';
import type { Criterion, Grid } from './types';

// Deterministik RNG (mulberry32) — günlük görev/aynı grid paylaşımı için seed'lenebilir.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const byClub = new Map<string, PlayerSeed[]>();
const byNation = new Map<string, PlayerSeed[]>();
for (const p of ALL_PLAYERS) {
  for (const c of p.clubs) {
    if (!byClub.has(c)) byClub.set(c, []);
    byClub.get(c)!.push(p);
  }
  if (!byNation.has(p.nat)) byNation.set(p.nat, []);
  byNation.get(p.nat)!.push(p);
}

export function matches(p: PlayerSeed, criterion: Criterion): boolean {
  return criterion.kind === 'club' ? p.clubs.includes(criterion.id) : p.nat === criterion.id;
}

export function solutions(row: Criterion, col: Criterion): PlayerSeed[] {
  const pool = col.kind === 'club' ? byClub.get(col.id) ?? [] : byNation.get(col.id) ?? [];
  return pool.filter((p) => matches(p, row));
}

export function criterionLabel(c: Criterion): string {
  if (c.kind === 'club') return clubById.get(c.id)?.name ?? c.id;
  return nationById.get(c.id)?.name ?? c.id;
}

const MIN_SOLUTIONS = 2;

// Grid üretiminde hücre çözülebilirliği yalnızca "güvenilir havuz" üzerinden
// sayılır: küratörlü kayıtlar + yüksek bilinirlikli (pop >= 0.15) Wikidata
// kayıtları. Böylece her hücre, bilinen oyuncularla çözülebilir; düşük
// bilinirlikli kayıtlar yine geçerli cevap olarak kabul edilir ama bir
// hücrenin TEK çözümü olamaz.
const RELIABLE: GamePlayer[] = ALL_PLAYERS.filter((p) => p.curated || p.pop >= 0.15);

// Kulüp-kulüp ve ülke-kulüp ortak oyuncu sayıları (grid üretimini hızlandırır).
const clubPairCount = new Map<string, number>();
const nationClubCount = new Map<string, number>();
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
for (const p of RELIABLE) {
  for (let i = 0; i < p.clubs.length; i++) {
    const nk = `${p.nat}~${p.clubs[i]}`;
    nationClubCount.set(nk, (nationClubCount.get(nk) ?? 0) + 1);
    for (let j = i + 1; j < p.clubs.length; j++) {
      const key = pairKey(p.clubs[i], p.clubs[j]);
      clubPairCount.set(key, (clubPairCount.get(key) ?? 0) + 1);
    }
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 3 sütun (kulüp) + 3 satır (kulüp veya ülke) seçer; 9 hücrenin her birinde
 * en az MIN_SOLUTIONS çözüm olduğunu garanti eder.
 */
const reliableByClub = new Map<string, number>();
const reliableByNation = new Map<string, number>();
for (const p of RELIABLE) {
  for (const c of p.clubs) reliableByClub.set(c, (reliableByClub.get(c) ?? 0) + 1);
  reliableByNation.set(p.nat, (reliableByNation.get(p.nat) ?? 0) + 1);
}

export function generateGrid(seed: number): Grid {
  const rand = rng(seed);
  const clubIds = CLUBS.map((c) => c.id).filter((id) => (reliableByClub.get(id) ?? 0) >= 6);
  const nationIds = NATIONS.map((n) => n.id).filter((id) => (reliableByNation.get(id) ?? 0) >= 6);

  for (let attempt = 0; attempt < 200; attempt++) {
    const cols = shuffled(clubIds, rand).slice(0, 3);
    const clubRowCands = clubIds.filter(
      (id) => !cols.includes(id) && cols.every((c) => (clubPairCount.get(pairKey(id, c)) ?? 0) >= MIN_SOLUTIONS),
    );
    const nationRowCands = nationIds.filter((n) =>
      cols.every((c) => (nationClubCount.get(`${n}~${c}`) ?? 0) >= MIN_SOLUTIONS),
    );

    const wantNationRow = rand() < 0.6 && nationRowCands.length > 0;
    const rows: Criterion[] = [];
    if (wantNationRow && clubRowCands.length >= 2) {
      rows.push({ kind: 'nation', id: pick(nationRowCands, rand) });
      for (const id of shuffled(clubRowCands, rand).slice(0, 2)) rows.push({ kind: 'club', id });
    } else if (clubRowCands.length >= 3) {
      for (const id of shuffled(clubRowCands, rand).slice(0, 3)) rows.push({ kind: 'club', id });
    } else {
      continue;
    }
    // Satırlar rastgele sıralansın (ülke satırı hep en üstte olmasın).
    const finalRows = shuffled(rows, rand);
    return {
      rows: finalRows as Grid['rows'],
      cols: cols.map((id): Criterion => ({ kind: 'club', id })) as Grid['cols'],
    };
  }
  // Emniyet ağı: seed veri setiyle doğrulanmış, her hücresi çözülebilir sabit grid.
  return {
    rows: [
      { kind: 'club', id: 'galatasaray' },
      { kind: 'club', id: 'man-united' },
      { kind: 'club', id: 'inter' },
    ],
    cols: [
      { kind: 'club', id: 'fenerbahce' },
      { kind: 'club', id: 'chelsea' },
      { kind: 'club', id: 'atletico' },
    ],
  };
}
