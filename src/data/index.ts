// Oyuncu havuzu birleştirme katmanı: elle küratörlü çekirdek (players.ts) +
// Wikidata'dan üretilen geniş havuz (players.generated.json).
// Çakışmada küratörlü kayıt kazanır (kariyer verisi elle doğrulanmış);
// üretilen kayıttan yalnızca fotoğraf devralınır.
import { PLAYERS as CURATED, PlayerSeed, Position } from './players';
import { clubById, nationById } from './clubs';
import generatedRaw from './players.generated.json';

export interface GamePlayer extends PlayerSeed {
  photo?: string | null;
  curated: boolean;
  /** 0..1 arası bilinirlik (küratörlü=1, aksi halde Wikidata sitelink sayısından) */
  pop: number;
}

interface GeneratedRow {
  name: string;
  nat: string;
  pos: string;
  clubs: string[];
  photo?: string | null;
  links?: number;
}

const POSITIONS = new Set<Position>(['GK', 'DF', 'MF', 'FW']);

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Bilinirlik eşiği: örneklem doğrulamasında hataların (altyapı/rezerv üyeliğinin
// A takım sanılması, çifte vatandaşlık) uzun kuyruktaki düşük-sitelink kayıtlarda
// yoğunlaştığı görüldü. links < 6 kayıtlar havuza alınmaz.
const MIN_LINKS = 6;

const generated: GeneratedRow[] = (generatedRaw as GeneratedRow[]).filter(
  (row) =>
    row.name &&
    row.name.length >= 3 &&
    (row.links ?? 0) >= MIN_LINKS &&
    nationById.has(row.nat) &&
    Array.isArray(row.clubs) &&
    row.clubs.some((c) => clubById.has(c)),
);

const byName = new Map<string, GamePlayer>();
for (const p of CURATED) {
  byName.set(fold(p.name), { ...p, photo: null, curated: true, pop: 1 });
}
for (const row of generated) {
  const key = fold(row.name);
  const existing = byName.get(key);
  if (existing) {
    if (!existing.photo && row.photo) existing.photo = row.photo;
    continue;
  }
  byName.set(key, {
    name: row.name,
    nat: row.nat,
    pos: POSITIONS.has(row.pos as Position) ? (row.pos as Position) : 'MF',
    clubs: row.clubs.filter((c) => clubById.has(c)),
    photo: row.photo ?? null,
    curated: false,
    pop: Math.min(row.links ?? 0, 60) / 60,
  });
}

// Küratörlü kayıtlar önde: arama eşitliklerinde bilinen isimler üste çıkar.
export const ALL_PLAYERS: GamePlayer[] = [...byName.values()].sort(
  (a, b) => Number(b.curated) - Number(a.curated),
);

/** Wikimedia Commons dosya adından küçük boy fotoğraf URL'si üretir. */
export function photoUrl(fileName: string, width = 128): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}
