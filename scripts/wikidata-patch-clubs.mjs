#!/usr/bin/env node
/**
 * İlk import'ta yanlış/eksik çözülen kulüpleri yamalar:
 * GS + FB (çözülememişti), Sevilla + Roma (yanlış varlık; önce temizlenir).
 * Kullanım: node scripts/wikidata-patch-clubs.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'balluiz-data-import/2.0 (acik-kaynak futbol quiz oyunu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PATCH = {
  galatasaray: 'Q495299',
  fenerbahce: 'Q6601875',
  sevilla: 'Q10329',
  roma: 'Q2739',
};
const CLEAN = ['sevilla', 'roma']; // yanlış varlıktan gelen etiketler silinir

const NATION_QID_OVERRIDES = { Q21: 'EN', Q25: 'WA', Q22: 'SC' };

async function api(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = Math.max((Number(res.headers.get('retry-after')) || 0) * 1000, 15000 * (i + 1));
      console.log(`   … HTTP ${res.status}, ${Math.round(wait / 1000)}sn`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('429');
}

function mapPosition(label = '') {
  const l = label.toLowerCase();
  if (l.includes('goalkeeper') || l.includes('kaleci')) return 'GK';
  if (l.includes('defender') || l.includes('bek') || l.includes('stoper')) return 'DF';
  if (l.includes('midfield') || l.includes('orta saha')) return 'MF';
  if (/(forward|striker|winger|santrfor|forvet|kanat)/.test(l)) return 'FW';
  return null;
}

async function roster(clubId, qid) {
  const sparql = `
SELECT ?p ?pLabel ?iso ?natQ ?posLabel ?img ?links WHERE {
  ?p p:P54 ?st . ?st ps:P54 wd:${qid} .
  ?p wikibase:sitelinks ?links . FILTER(?links >= 4)
  ?p wdt:P569 ?born . FILTER(YEAR(?born) >= 1975)
  OPTIONAL { ?p wdt:P1532 ?n1 . }
  OPTIONAL { ?p wdt:P27 ?n2 . }
  BIND(COALESCE(?n1, ?n2) AS ?nat)
  BIND(STRAFTER(STR(?nat), "entity/") AS ?natQ)
  OPTIONAL { ?nat wdt:P297 ?iso . }
  OPTIONAL { ?p wdt:P413 ?pos . }
  OPTIONAL { ?p wdt:P18 ?img . }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "tr,en".
    ?p rdfs:label ?pLabel . ?pos rdfs:label ?posLabel .
  }
}`;
  const json = await api(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
  );
  return json.results.bindings.map((b) => ({
    name: b.pLabel?.value,
    iso: b.iso?.value,
    natQ: b.natQ?.value,
    pos: mapPosition(b.posLabel?.value),
    img: b.img?.value ? decodeURIComponent(b.img.value.split('/').pop()) : null,
    links: Number(b.links?.value ?? 0),
    club: clubId,
  }));
}

const file = new URL('../src/data/players.generated.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));

// 1) Yanlış varlıktan gelen kulüp etiketlerini temizle
let cleaned = 0;
for (const p of data) {
  const before = p.clubs.length;
  p.clubs = p.clubs.filter((c) => !CLEAN.includes(c));
  cleaned += before - p.clubs.length;
}
console.log(`temizlenen yanlış etiket: ${cleaned}`);

// 2) Doğru kadroları çek ve isimle birleştir
const byName = new Map(data.map((p) => [p.name, p]));
for (const [clubId, qid] of Object.entries(PATCH)) {
  const rows = await roster(clubId, qid);
  let added = 0;
  for (const row of rows) {
    if (!row.name || /^Q\d+$/.test(row.name)) continue;
    const nat = NATION_QID_OVERRIDES[row.natQ] ?? row.iso ?? null;
    if (!nat) continue;
    const existing = byName.get(row.name);
    if (existing) {
      if (!existing.clubs.includes(clubId)) existing.clubs.push(clubId);
      existing.photo = existing.photo ?? row.img;
    } else {
      const rec = {
        name: row.name,
        nat,
        pos: row.pos ?? 'MF',
        clubs: [clubId],
        photo: row.img,
        links: row.links,
      };
      data.push(rec);
      byName.set(row.name, rec);
    }
    added++;
  }
  console.log(`${clubId}: ${rows.length} satır, ${added} işlendi (toplam ${data.length})`);
  await sleep(3000);
}

// 3) Kulüpsüz kalan kayıtları at
const out = data.filter((p) => p.clubs.length > 0).sort((a, b) => b.links - a.links);
writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`${out.length} oyuncu yazıldı`);
