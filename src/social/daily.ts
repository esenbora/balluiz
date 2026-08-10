// Günün gridi + meydan okuma kodları (saf fonksiyonlar; RN bağımlılığı yok).
import type { GameState } from '../engine/types';

// Lansman referans günü — "Günün Gridi #1"
const EPOCH = Date.UTC(2026, 7, 10); // 10 Ağustos 2026

/** Herkes için aynı olan günlük sayı (1'den başlar). */
export function dailyNumber(now: Date = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((today - EPOCH) / 86400000) + 1);
}

/** Gün numarasından deterministik seed: tüm oyuncular aynı gridi görür. */
export function dailySeed(now: Date = new Date()): number {
  let h = 2166136261 ^ dailyNumber(now);
  h = Math.imul(h, 16777619) ^ 0xb11a1;
  return h >>> 0;
}

/** Meydan okuma kodu: seed <-> insan dostu base36 kod. */
export function seedToCode(seed: number): string {
  return (seed >>> 0).toString(36).toUpperCase();
}

export function codeToSeed(code: string): number | null {
  const cleaned = code.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 36);
  if (!Number.isFinite(n) || n < 0 || n > 0xffffffff) return null;
  return n >>> 0;
}

/** Wordle tarzı, spoiler içermeyen emoji sonuç kartı. */
export function buildShareText(
  state: GameState,
  opts: { daily: boolean; dailyNo?: number; code?: string; lang: 'tr' | 'en' },
): string {
  const rows: string[] = [];
  for (let r = 0; r < 3; r++) {
    let line = '';
    for (let c = 0; c < 3; c++) {
      const owner = state.cells[r * 3 + c].owner;
      line += owner === 'X' ? '🟦' : owner === 'O' ? '🟥' : '⬜';
    }
    rows.push(line);
  }
  const x = state.cells.filter((c) => c.owner === 'X').length;
  const o = state.cells.filter((c) => c.owner === 'O').length;
  const title = opts.daily
    ? `⚽ Balluiz — ${opts.lang === 'tr' ? 'Günün Gridi' : 'Daily Grid'} #${opts.dailyNo ?? dailyNumber()}`
    : `⚽ Balluiz`;
  const score =
    state.winner === 'draw'
      ? `${x} - ${o} 🤝`
      : state.winner === 'X'
        ? `${x} - ${o} 🏆`
        : `${x} - ${o}`;
  const challenge = opts.code
    ? opts.lang === 'tr'
      ? `\nBeni geç: kodu gir → ${opts.code}`
      : `\nBeat me: enter code → ${opts.code}`
    : '';
  return `${title}\n${rows.join('\n')}\n${opts.lang === 'tr' ? 'Skor' : 'Score'}: ${score}${challenge}`;
}
