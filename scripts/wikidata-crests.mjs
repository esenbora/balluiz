#!/usr/bin/env node
/**
 * Kulüp armalarını Wikidata P154 (logo görseli) üzerinden çeker.
 * P154 yalnızca Wikimedia Commons dosyalarına bağlanabilir — yani gelen her
 * arma Commons'ın serbest lisans/PD politikasına tabidir ("açık kaynak").
 * Not: telif ayrı, marka ayrı — armaların ticari üründe kullanımı marka
 * hukuku riski taşır (bkz. docs/ANALIZ.md); ürün kararı sahibine aittir.
 * Commons'ta arması olmayan kulüplerde uygulama SVG kalkana düşer.
 *
 * Girdi:  scratchpad/club-qids.txt (import loglarından; "id QID" satırları)
 * Çıktı:  src/data/crests.json  { clubId: "Dosya adı.svg" }
 * Kullanım: node scripts/wikidata-crests.mjs /path/to/club-qids.txt
 */
import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'balluiz-data-import/2.2 (acik-kaynak futbol quiz oyunu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const qidFile = process.argv[2];
if (!qidFile) throw new Error('kullanım: node scripts/wikidata-crests.mjs <club-qids.txt>');
const pairs = readFileSync(qidFile, 'utf8')
  .trim()
  .split('\n')
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => p.length === 2);
const byQid = new Map(pairs.map(([id, qid]) => [qid, id]));

async function api(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(15000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('429');
}

const values = pairs.map(([, qid]) => `wd:${qid}`).join(' ');
const sparql = `
SELECT ?club ?logo WHERE {
  VALUES ?club { ${values} }
  ?club wdt:P154 ?logo .
}`;
const json = await api(
  `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
);

const crests = {};
for (const b of json.results.bindings) {
  const qid = b.club.value.split('/entity/').pop();
  const clubId = byQid.get(qid);
  const file = b.logo?.value ? decodeURIComponent(b.logo.value.split('/').pop()) : null;
  if (clubId && file && !crests[clubId]) crests[clubId] = file;
}

writeFileSync(
  new URL('../src/data/crests.json', import.meta.url),
  JSON.stringify(crests, null, 1),
);
const missing = pairs.map(([id]) => id).filter((id) => !crests[id]);
console.log(`${Object.keys(crests).length}/${pairs.length} kulüp arması bulundu`);
console.log('Commons arması olmayanlar (SVG kalkana düşer):', missing.join(', ') || 'yok');
