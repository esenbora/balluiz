// Türkçe karakter ve aksan toleranslı metin normalizasyonu + arama.
// Rakip uygulamadaki en büyük şikayetlerden biri klavye/arama hatalarıydı;
// burada "Sukur" yazınca "Şükür", "gundogan" yazınca "Gündoğan" bulunur.

const MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
  ñ: 'n', ß: 'ss', æ: 'ae', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ł: 'l',
};

export function normalize(text: string): string {
  let out = '';
  for (const ch of text) {
    out += MAP[ch] ?? ch;
  }
  return out
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Searchable<T> {
  item: T;
  norm: string;
  tokens: string[];
}

export function buildIndex<T>(items: T[], text: (item: T) => string): Searchable<T>[] {
  return items.map((item) => {
    const norm = normalize(text(item));
    return { item, norm, tokens: norm.split(' ') };
  });
}

/**
 * Her sorgu kelimesi, hedefin herhangi bir kelimesinin öneki olmalı.
 * Tam ad eşleşmesi en üstte, ardından soyadı önek eşleşmesi gelir.
 */
export function search<T>(index: Searchable<T>[], query: string, limit = 8): T[] {
  const q = normalize(query);
  if (!q) return [];
  const qTokens = q.split(' ');
  const scored: { item: T; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    let allMatch = true;
    for (const qt of qTokens) {
      let best = 0;
      for (let i = 0; i < entry.tokens.length; i++) {
        const t = entry.tokens[i];
        if (t === qt) best = Math.max(best, 3);
        else if (t.startsWith(qt)) best = Math.max(best, i === entry.tokens.length - 1 ? 2.5 : 2);
        else if (t.includes(qt)) best = Math.max(best, 1);
      }
      if (best === 0) {
        allMatch = false;
        break;
      }
      score += best;
    }
    if (!allMatch) continue;
    if (entry.norm === q) score += 10;
    if (entry.norm.startsWith(q)) score += 2;
    scored.push({ item: entry.item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
