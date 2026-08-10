#!/usr/bin/env node
/**
 * Eksik kulüp armaları için derin arama:
 *  1) Wikidata varlık araması → aday varlıkların (ana kulüp dahil) P154'ü
 *  2) Commons dosya araması (logo/crest/escudo/badge/arma/wappen)
 * Adaylar skorlanır, kulüp başına en iyi 2 aday çıktı dosyasına yazılır.
 * Görsel QA sonrası seçim ayrı adımda yapılır (otomatik güvenilmez).
 *
 * Kullanım: node scripts/wikidata-crests-deep.mjs
 * Çıktı: scratchpad tarafında kullanılacak candidates.json (stdout yolu yazar)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'balluiz-crest-search/1.0 (acik-kaynak futbol quiz oyunu)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Kulüp id → arama terimleri (yerel ad + yaygın ad)
const SEARCH_TERMS = {
  fenerbahce: ['Fenerbahçe'],
  'real-madrid': ['Real Madrid'],
  atletico: ['Atlético Madrid', 'Atletico Madrid'],
  sevilla: ['Sevilla FC'],
  villarreal: ['Villarreal CF'],
  'real-sociedad': ['Real Sociedad'],
  'man-united': ['Manchester United'],
  'man-city': ['Manchester City'],
  liverpool: ['Liverpool F.C.', 'Liverpool FC'],
  chelsea: ['Chelsea F.C.', 'Chelsea FC'],
  arsenal: ['Arsenal F.C.', 'Arsenal FC'],
  tottenham: ['Tottenham Hotspur'],
  newcastle: ['Newcastle United'],
  everton: ['Everton F.C.', 'Everton FC'],
  leicester: ['Leicester City'],
  'west-ham': ['West Ham United'],
  'aston-villa': ['Aston Villa'],
  leverkusen: ['Bayer Leverkusen', 'Bayer 04 Leverkusen'],
  psg: ['Paris Saint-Germain'],
  monaco: ['AS Monaco'],
  lyon: ['Olympique Lyonnais', 'Olympique lyonnais'],
  lille: ['Lille OSC', 'LOSC Lille'],
  roma: ['AS Roma'],
  ajax: ['AFC Ajax', 'Ajax Amsterdam'],
  psv: ['PSV Eindhoven'],
  feyenoord: ['Feyenoord'],
  porto: ['FC Porto'],
  benfica: ['S.L. Benfica', 'SL Benfica'],
  sporting: ['Sporting CP', 'Sporting Clube de Portugal'],
  celtic: ['Celtic F.C.', 'Celtic FC'],
  rangers: ['Rangers F.C.', 'Rangers FC'],
  'inter-miami': ['Inter Miami'],
  flamengo: ['Flamengo', 'CR Flamengo'],
  santos: ['Santos FC'],
  shakhtar: ['Shakhtar Donetsk'],
  trabzonspor: ['Trabzonspor'],
  basaksehir: ['Başakşehir', 'Istanbul Basaksehir'],
  antalyaspor: ['Antalyaspor'],
  konyaspor: ['Konyaspor'],
  alanyaspor: ['Alanyaspor'],
  bursaspor: ['Bursaspor'],
  kayserispor: ['Kayserispor'],
  samsunspor: ['Samsunspor'],
  brighton: ['Brighton & Hove Albion', 'Brighton Hove Albion'],
  fulham: ['Fulham F.C.', 'Fulham FC'],
  'crystal-palace': ['Crystal Palace F.C.', 'Crystal Palace FC'],
  wolves: ['Wolverhampton Wanderers'],
  southampton: ['Southampton F.C.', 'Southampton FC'],
  leeds: ['Leeds United'],
  'nottingham-forest': ['Nottingham Forest'],
  brentford: ['Brentford F.C.', 'Brentford FC'],
  stoke: ['Stoke City'],
  watford: ['Watford F.C.', 'Watford FC'],
  valencia: ['Valencia CF'],
  betis: ['Real Betis'],
  athletic: ['Athletic Bilbao', 'Athletic Club'],
  espanyol: ['RCD Espanyol'],
  malaga: ['Málaga CF', 'Malaga CF'],
  torino: ['Torino FC', 'Torino F.C.'],
  genoa: ['Genoa CFC', 'Genoa C.F.C.'],
  frankfurt: ['Eintracht Frankfurt'],
  koln: ['1. FC Köln', 'FC Koln'],
  rennes: ['Stade Rennais'],
  lens: ['RC Lens'],
  'saint-etienne': ['AS Saint-Étienne', 'Saint-Etienne'],
  braga: ['SC Braga', 'S.C. Braga'],
  olympiacos: ['Olympiacos'],
  anderlecht: ['RSC Anderlecht', 'R.S.C. Anderlecht'],
  brugge: ['Club Brugge'],
  salzburg: ['Red Bull Salzburg'],
  'al-ittihad': ['Al-Ittihad Jeddah', 'Al Ittihad Club'],
  'al-ahli': ['Al-Ahli Saudi', 'Al-Ahli Jeddah'],
  corinthians: ['Corinthians'],
  'sao-paulo': ['São Paulo FC', 'Sao Paulo FC'],
  gremio: ['Grêmio', 'Gremio'],
  racing: ['Racing Club Avellaneda', 'Racing Club'],
  independiente: ['Independiente'],
  barcelona: ['FC Barcelona'],
  liverpool2: [],
  porto2: [],
  sampdoria: ['UC Sampdoria', 'U.C. Sampdoria'],
};

const GOOD = /(logo|crest|escudo|badge|arma|wappen|emblem|stemma)/i;
const BAD = /(flag|bandera|kit|stadium|stade|estadio|photo|banner|map|wordmark|text.?logo|scarf|fans|tifo|jersey|shirt|1900|1910|1920|old|historic|ancien|retro)/i;

async function api(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(10000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('429');
}

function scoreFile(name) {
  let s = 0;
  if (GOOD.test(name)) s += 3;
  if (BAD.test(name)) s -= 8;
  if (name.toLowerCase().endsWith('.svg')) s += 2;
  if (name.length < 40) s += 1;
  return s;
}

// 1) Wikidata varlık adaylarının P154'ü
async function wikidataCandidates(term) {
  const found = await api(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&type=item&limit=8&format=json`,
  );
  const ids = (found.search ?? []).map((s) => s.id);
  if (!ids.length) return [];
  const ent = await api(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=claims&format=json`,
  );
  const files = [];
  for (const id of ids) {
    const p154 = ent.entities?.[id]?.claims?.P154 ?? [];
    for (const c of p154) {
      const f = c.mainsnak?.datavalue?.value;
      if (f) files.push(f);
    }
  }
  return files;
}

// 2) Commons dosya araması
async function commonsCandidates(term) {
  const q = encodeURIComponent(`intitle:"${term}" (logo OR crest OR escudo OR badge OR arma OR wappen)`);
  const json = await api(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=10&format=json`,
  );
  return (json.query?.search ?? []).map((r) => r.title.replace(/^File:/, ''));
}

const missingArg = process.argv[2];
const crests = JSON.parse(readFileSync(new URL('../src/data/crests.json', import.meta.url), 'utf8'));
const missing = missingArg
  ? missingArg.split(',')
  : Object.keys(SEARCH_TERMS).filter((id) => !crests[id] && SEARCH_TERMS[id].length);

const out = {};
for (const clubId of missing) {
  const terms = SEARCH_TERMS[clubId] ?? [];
  const all = new Map();
  for (const term of terms) {
    try {
      for (const f of await wikidataCandidates(term)) all.set(f, (all.get(f) ?? 0) + 4);
      await sleep(400);
      for (const f of await commonsCandidates(term)) all.set(f, (all.get(f) ?? 0) + 1);
      await sleep(400);
    } catch (err) {
      console.error(`${clubId} (${term}): ${err.message}`);
    }
  }
  const ranked = [...all.entries()]
    .map(([f, base]) => ({ f, s: base + scoreFile(f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2);
  if (ranked.length) {
    out[clubId] = ranked.map((x) => x.f);
    console.log(`✓ ${clubId}: ${ranked.map((x) => `${x.f} (${x.s})`).join(' | ')}`);
  } else {
    console.log(`✗ ${clubId}: aday yok`);
  }
}

const outPath = process.env.OUT ?? '/tmp/crest-candidates.json';
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length}/${missing.length} kulüp için aday → ${outPath}`);
