#!/usr/bin/env node
/**
 * Wikidata'dan (CC0 açık veri) oyuncu + kariyer + fotoğraf çeker.
 * Çıktı: src/data/players.generated.json
 *
 * Aşamalar:
 *  1. Kulüp QID çözümü: isimle arama + P31=futbol kulübü doğrulaması
 *     (QID'ler elle yazılmaz — yanlış eşleşme riskine karşı her seferinde çözülür)
 *  2. Kulüp başına SPARQL kadro sorgusu (P54), uyruk (P1532/P27→ISO),
 *     pozisyon (P413), fotoğraf (P18, Wikimedia Commons dosya adı)
 *  3. Filtre: doğum >= 1975 (modern dönem; efsaneler elle küratörlü veride),
 *     sitelink >= 4 (bilinirlik eşiği)
 *
 * Kullanım: node scripts/wikidata-import.mjs
 */
import { writeFileSync } from 'node:fs';

const UA = 'balluiz-data-import/2.0 (acik-kaynak futbol quiz oyunu; iletisim: repo issues)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// clubs.ts kimliği → Wikidata arama metni (futbol şubesini bulmak için)
const CLUB_SEARCH = {
  galatasaray: 'Galatasaray S.K. (football)',
  fenerbahce: 'Fenerbahçe S.K. (football)',
  besiktas: 'Beşiktaş J.K. (football)',
  trabzonspor: 'Trabzonspor',
  barcelona: 'FC Barcelona',
  'real-madrid': 'Real Madrid CF',
  atletico: 'Atlético Madrid',
  sevilla: 'Sevilla FC',
  villarreal: 'Villarreal CF',
  'real-sociedad': 'Real Sociedad',
  'man-united': 'Manchester United F.C.',
  'man-city': 'Manchester City F.C.',
  liverpool: 'Liverpool F.C.',
  chelsea: 'Chelsea F.C.',
  arsenal: 'Arsenal F.C.',
  tottenham: 'Tottenham Hotspur',
  newcastle: 'Newcastle United',
  everton: 'Everton F.C.',
  leicester: 'Leicester City',
  'west-ham': 'West Ham United',
  'aston-villa': 'Aston Villa',
  bayern: 'FC Bayern Munich',
  dortmund: 'Borussia Dortmund',
  leverkusen: 'Bayer 04 Leverkusen',
  schalke: 'FC Schalke 04',
  wolfsburg: 'VfL Wolfsburg',
  leipzig: 'RB Leipzig',
  psg: 'Paris Saint-Germain F.C.',
  monaco: 'AS Monaco FC',
  marseille: 'Olympique de Marseille',
  lyon: 'Olympique Lyonnais',
  lille: 'Lille OSC',
  juventus: 'Juventus FC',
  milan: 'AC Milan',
  inter: 'Inter Milan',
  roma: 'AS Roma',
  napoli: 'SSC Napoli',
  lazio: 'SS Lazio',
  fiorentina: 'ACF Fiorentina',
  atalanta: 'Atalanta BC',
  ajax: 'AFC Ajax',
  psv: 'PSV Eindhoven',
  feyenoord: 'Feyenoord',
  porto: 'FC Porto',
  benfica: 'S.L. Benfica',
  sporting: 'Sporting CP',
  celtic: 'Celtic F.C.',
  rangers: 'Rangers F.C.',
  'al-nassr': 'Al-Nassr FC',
  'al-hilal': 'Al-Hilal SFC',
  'inter-miami': 'Inter Miami CF',
  'la-galaxy': 'LA Galaxy',
  flamengo: 'CR Flamengo',
  boca: 'Boca Juniors',
  river: 'River Plate',
  santos: 'Santos FC',
  shakhtar: 'FC Shakhtar Donetsk',
  zenit: 'FC Zenit Saint Petersburg',
};

// İngiltere/Galler/İskoçya'nın ISO alpha-2 kodu yok — QID'den maplenir.
const NATION_QID_OVERRIDES = { Q21: 'EN', Q25: 'WA', Q22: 'SC' };

const FOOTBALL_CLUB = 'Q476028'; // association football club
const FOOTBALL = 'Q2736'; // association football (sport)

/** 429/5xx için üstel backoff'lu fetch. Retry-After başlığına saygı duyar. */
async function api(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      const wait = Math.max(retryAfter * 1000, 15000 * (i + 1));
      console.log(`   … HTTP ${res.status}, ${Math.round(wait / 1000)}sn bekleniyor`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('HTTP 429 (denemeler tükendi)');
}

/** QID'nin gerçekten oyuncu kadrosu olan futbol kulübü olduğunu doğrular. */
async function rosterCount(qid) {
  const sparql = `SELECT (COUNT(?p) AS ?c) WHERE { ?p p:P54/ps:P54 wd:${qid} . }`;
  const json = await api(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`,
  );
  return Number(json.results.bindings[0]?.c?.value ?? 0);
}

/** Kulüp adını futbol kulübü QID'sine çözer; kadrosu boş adayları eler. */
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
    await sleep(500);
    if ((await rosterCount(id)) >= 20) return id; // gerçek kadrolu şube
  }
  return null;
}

function mapPosition(label = '') {
  const l = label.toLowerCase();
  if (l.includes('goalkeeper') || l.includes('kaleci')) return 'GK';
  if (l.includes('defender') || l.includes('defence') || l.includes('bek') || l.includes('stoper'))
    return 'DF';
  if (l.includes('midfield') || l.includes('orta saha')) return 'MF';
  if (
    l.includes('forward') ||
    l.includes('striker') ||
    l.includes('winger') ||
    l.includes('santrfor') ||
    l.includes('forvet') ||
    l.includes('kanat')
  )
    return 'FW';
  return null;
}

async function rosterQuery(clubId, qid) {
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
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const json = await api(url);
  return json.results.bindings.map((b) => ({
    qid: b.p?.value?.split('/entity/').pop(),
    name: b.pLabel?.value,
    iso: b.iso?.value,
    natQ: b.natQ?.value,
    pos: mapPosition(b.posLabel?.value),
    img: b.img?.value ? decodeURIComponent(b.img.value.split('/').pop()) : null,
    links: Number(b.links?.value ?? 0),
    club: clubId,
  }));
}

// ── Ana akış ──
const clubQids = {};
for (const [clubId, search] of Object.entries(CLUB_SEARCH)) {
  try {
    const qid = await resolveClub(search);
    if (qid) {
      clubQids[clubId] = qid;
      console.log(`✓ ${clubId} → ${qid}`);
    } else {
      console.error(`✗ ${clubId}: çözülemedi (${search})`);
    }
  } catch (err) {
    console.error(`✗ ${clubId}: ${err.message}`);
  }
  await sleep(1500);
}

const players = new Map(); // qid → kayıt
for (const [clubId, qid] of Object.entries(clubQids)) {
  try {
    const rows = await rosterQuery(clubId, qid);
    let added = 0;
    for (const row of rows) {
      if (!row.name || !row.qid || /^Q\d+$/.test(row.name)) continue;
      const nat = NATION_QID_OVERRIDES[row.natQ] ?? row.iso ?? null;
      if (!nat) continue;
      const entry =
        players.get(row.qid) ??
        {
          name: row.name,
          nat,
          pos: null,
          clubs: new Set(),
          photo: null,
          links: 0,
        };
      entry.clubs.add(row.club);
      entry.pos = entry.pos ?? row.pos;
      entry.photo = entry.photo ?? row.img;
      entry.links = Math.max(entry.links, row.links);
      players.set(row.qid, entry);
      added++;
    }
    console.log(`${clubId}: ${rows.length} satır, ${added} kayıt (toplam ${players.size})`);
  } catch (err) {
    console.error(`${clubId} atlandı: ${err.message}`);
  }
  await sleep(2500);
}

const out = [...players.values()]
  .map((p) => ({
    name: p.name,
    nat: p.nat,
    pos: p.pos ?? 'MF',
    clubs: [...p.clubs],
    photo: p.photo,
    links: p.links,
  }))
  .sort((a, b) => b.links - a.links);

writeFileSync(
  new URL('../src/data/players.generated.json', import.meta.url),
  JSON.stringify(out, null, 1),
);
console.log(`\n${out.length} oyuncu yazıldı → src/data/players.generated.json`);
