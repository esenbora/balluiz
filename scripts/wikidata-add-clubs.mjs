#!/usr/bin/env node
/**
 * Mevcut players.generated.json'a YENİ kulüplerin kadrolarını ekler
 * (inkremental — tüm import'u baştan koşturmaz).
 * Kullanım: node scripts/wikidata-add-clubs.mjs id1 id2 ...
 *           (argümansız: aşağıdaki NEW_CLUBS listesinin tamamı)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'balluiz-data-import/2.1 (acik-kaynak futbol quiz oyunu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// clubs.ts kimliği → Wikidata arama metni
const NEW_CLUBS = {
  basaksehir: 'İstanbul Başakşehir F.K.',
  kasimpasa: 'Kasımpaşa S.K.',
  antalyaspor: 'Antalyaspor',
  konyaspor: 'Konyaspor',
  sivasspor: 'Sivasspor',
  alanyaspor: 'Alanyaspor',
  rizespor: 'Çaykur Rizespor',
  bursaspor: 'Bursaspor',
  kayserispor: 'Kayserispor',
  samsunspor: 'Samsunspor',
  brighton: 'Brighton & Hove Albion',
  fulham: 'Fulham F.C.',
  'crystal-palace': 'Crystal Palace F.C.',
  wolves: 'Wolverhampton Wanderers',
  southampton: 'Southampton F.C.',
  leeds: 'Leeds United',
  'nottingham-forest': 'Nottingham Forest',
  brentford: 'Brentford F.C.',
  stoke: 'Stoke City',
  watford: 'Watford F.C.',
  valencia: 'Valencia CF',
  betis: 'Real Betis',
  athletic: 'Athletic Bilbao',
  celta: 'RC Celta de Vigo',
  espanyol: 'RCD Espanyol',
  malaga: 'Málaga CF',
  torino: 'Torino F.C.',
  sampdoria: 'U.C. Sampdoria',
  genoa: 'Genoa C.F.C.',
  parma: 'Parma Calcio 1913',
  udinese: 'Udinese Calcio',
  bologna: 'Bologna F.C. 1909',
  frankfurt: 'Eintracht Frankfurt',
  gladbach: 'Borussia Mönchengladbach',
  stuttgart: 'VfB Stuttgart',
  werder: 'SV Werder Bremen',
  hamburg: 'Hamburger SV',
  koln: '1. FC Köln',
  rennes: 'Stade Rennais F.C.',
  nice: 'OGC Nice',
  lens: 'RC Lens',
  nantes: 'FC Nantes',
  'saint-etienne': 'AS Saint-Étienne',
  az: 'AZ Alkmaar',
  braga: 'S.C. Braga',
  olympiacos: 'Olympiacos F.C.',
  panathinaikos: 'Panathinaikos F.C.',
  anderlecht: 'R.S.C. Anderlecht',
  brugge: 'Club Brugge KV',
  salzburg: 'FC Red Bull Salzburg',
  'al-ittihad': 'Al-Ittihad Club (Jeddah)',
  'al-ahli': 'Al-Ahli Saudi FC',
  lafc: 'Los Angeles FC',
  palmeiras: 'Sociedade Esportiva Palmeiras',
  corinthians: 'Sport Club Corinthians Paulista',
  'sao-paulo': 'São Paulo FC',
  gremio: 'Grêmio Foot-Ball Porto Alegrense',
  racing: 'Racing Club de Avellaneda',
  independiente: 'Club Atlético Independiente',
};

const NATION_QID_OVERRIDES = { Q21: 'EN', Q25: 'WA', Q22: 'SC' };
const FOOTBALL_CLUB = 'Q476028';
const FOOTBALL = 'Q2736';

async function api(url, tries = 7) {
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
  throw new Error('429 (denemeler tükendi)');
}

async function rosterCount(qid) {
  const sparql = `SELECT (COUNT(?p) AS ?c) WHERE { ?p p:P54/ps:P54 wd:${qid} . }`;
  const json = await api(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
  );
  return Number(json.results.bindings[0]?.c?.value ?? 0);
}

async function resolveClub(search) {
  const q = encodeURIComponent(search);
  const found = await api(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}&language=en&type=item&limit=12&format=json`,
  );
  const ids = (found.search ?? []).map((s) => s.id);
  if (!ids.length) return null;
  const ent = await api(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=claims&format=json`,
  );
  const candidates = [];
  for (const id of ids) {
    const claims = ent.entities?.[id]?.claims ?? {};
    const p31 = (claims.P31 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id);
    const p641 = (claims.P641 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id);
    if (p31.includes(FOOTBALL_CLUB)) candidates.push(id);
    else if (p641.includes(FOOTBALL)) candidates.push(id);
  }
  for (const id of candidates) {
    await sleep(600);
    if ((await rosterCount(id)) >= 20) return id;
  }
  return null;
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
  }));
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(NEW_CLUBS);

const file = new URL('../src/data/players.generated.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const byName = new Map(data.map((p) => [p.name, p]));

for (const clubId of targets) {
  const search = NEW_CLUBS[clubId];
  if (!search) {
    console.error(`? ${clubId}: NEW_CLUBS içinde yok, atlandı`);
    continue;
  }
  try {
    const qid = await resolveClub(search);
    if (!qid) {
      console.error(`✗ ${clubId}: çözülemedi (${search})`);
      continue;
    }
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
        existing.links = Math.max(existing.links ?? 0, row.links);
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
    console.log(`✓ ${clubId} (${qid}): ${rows.length} satır, ${added} işlendi (toplam ${data.length})`);
    // Her kulüpten sonra ara kayıt — kesinti durumunda ilerleme kaybolmaz
    writeFileSync(file, JSON.stringify(data.sort((a, b) => (b.links ?? 0) - (a.links ?? 0)), null, 1));
  } catch (err) {
    console.error(`✗ ${clubId}: ${err.message}`);
  }
  await sleep(2500);
}
console.log(`bitti: ${data.length} oyuncu`);
