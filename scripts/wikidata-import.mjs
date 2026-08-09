#!/usr/bin/env node
/**
 * Wikidata'dan (CC0 lisanslı açık veri) futbolcu + kulüp kariyeri çeker ve
 * src/data/players.generated.json dosyasına yazar. Amaç: "ciddi oyuncu
 * genişliği" — seed veritabanını binlerce oyuncuya çıkarmak.
 *
 * Kullanım:  node scripts/wikidata-import.mjs
 *
 * Not: SPARQL endpoint'i oran sınırlıdır; script kulüp başına sorgu atar ve
 * aralara bekleme koyar. Çıktı, clubs.ts içindeki kulüp kimlikleriyle eşlenir.
 */
import { writeFileSync } from 'node:fs';

// clubs.ts kimliği → Wikidata varlık kimliği
const CLUB_QIDS = {
  galatasaray: 'Q131499', fenerbahce: 'Q47774', besiktas: 'Q222948', trabzonspor: 'Q220964',
  barcelona: 'Q7156', 'real-madrid': 'Q8682', atletico: 'Q8701', sevilla: 'Q8703',
  villarreal: 'Q9142', 'real-sociedad': 'Q8698', 'man-united': 'Q18656', 'man-city': 'Q50602',
  liverpool: 'Q1130849', chelsea: 'Q9616', arsenal: 'Q9617', tottenham: 'Q18741',
  newcastle: 'Q18746', everton: 'Q5794', leicester: 'Q19308', 'west-ham': 'Q19457',
  'aston-villa': 'Q2597', bayern: 'Q15789', dortmund: 'Q41420', leverkusen: 'Q105513',
  schalke: 'Q163290', wolfsburg: 'Q163113', leipzig: 'Q705341', psg: 'Q483020',
  monaco: 'Q19339', marseille: 'Q132885', lyon: 'Q131419', lille: 'Q217122',
  juventus: 'Q1422', milan: 'Q1543', inter: 'Q631', roma: 'Q2739', napoli: 'Q265941',
  lazio: 'Q2611', fiorentina: 'Q13411', atalanta: 'Q2616', ajax: 'Q83958', psv: 'Q83959',
  feyenoord: 'Q83960', porto: 'Q128446', benfica: 'Q129987', sporting: 'Q128602',
  celtic: 'Q19593', rangers: 'Q19599',
  // TODO: QID'leri https://www.wikidata.org üzerinden doğrulayın; hatalı QID
  // sadece o kulübün atlanmasına yol açar (script hatada devam eder).
  'inter-miami': 'Q56653631', 'la-galaxy': 'Q252769', flamengo: 'Q142899', boca: 'Q131371',
  river: 'Q131373', santos: 'Q80019', shakhtar: 'Q135389', zenit: 'Q134669',
};

const ENDPOINT = 'https://query.wikidata.org/sparql';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function queryClub(clubId, qid) {
  const sparql = `
SELECT ?player ?playerLabel ?natCode ?posLabel WHERE {
  ?player p:P54 ?stmt .
  ?stmt ps:P54 wd:${qid} .
  ?player wdt:P1532|wdt:P27 ?nat .
  ?nat wdt:P984 ?natCode .
  OPTIONAL { ?player wdt:P413 ?pos . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}
LIMIT 2000`;
  const url = `${ENDPOINT}?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'balluiz-data-import/1.0 (futbol xox oyunu veri hazırlığı)' },
  });
  if (!res.ok) throw new Error(`${clubId}: HTTP ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map((b) => ({
    name: b.playerLabel?.value,
    nat: b.natCode?.value,
    pos: b.posLabel?.value,
    club: clubId,
  }));
}

const players = new Map();
for (const [clubId, qid] of Object.entries(CLUB_QIDS)) {
  try {
    const rows = await queryClub(clubId, qid);
    for (const row of rows) {
      if (!row.name || !row.nat) continue;
      const entry = players.get(row.name) ?? { name: row.name, nat: row.nat, clubs: new Set() };
      entry.clubs.add(row.club);
      players.set(row.name, entry);
    }
    console.log(`${clubId}: ${rows.length} kayıt (toplam ${players.size} oyuncu)`);
  } catch (err) {
    console.error(`${clubId} atlandı:`, err.message);
  }
  await sleep(1500);
}

const out = [...players.values()].map((p) => ({ ...p, clubs: [...p.clubs] }));
writeFileSync(
  new URL('../src/data/players.generated.json', import.meta.url),
  JSON.stringify(out, null, 1),
);
console.log(`\n${out.length} oyuncu yazıldı → src/data/players.generated.json`);
console.log('Not: IOC ülke kodları oyunun kodlarına maplenmeli; ayrıntı için docs/LANSMAN.md.');
