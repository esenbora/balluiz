# ⚽ Balluiz — Futbol XOX

Futbol bilgisiyle oynanan XOX: satır ve sütundaki iki kritere birden uyan
futbolcuyu bul, hücreyi kap, üçlüyü tamamla. React Native (Expo) ile hem
App Store hem Google Play hedefli.

> Pazar analizi ve rakip (TACTICO) incelemesi: [docs/ANALIZ.md](docs/ANALIZ.md)
> Mağaza lansman planı: [docs/LANSMAN.md](docs/LANSMAN.md)

## Özellikler (MVP)

- 3×3 kriter gridi: kulüp × kulüp ve ülke × kulüp; her hücrede **en az 2
  çözüm garantisi** (deterministik seed'li üretim → "günün gridi"ne hazır)
- Türkçe karakter toleranslı arama: `sukur` → *Hakan Şükür*
- 3 zorluk seviyeli bot (yalnızca adil bilgi kullanır) + aynı telefonda 2 kişi
- Çalma kuralı (3 hak), 30 sn tur süresi, maç başına tek kullanımlık isimler
- ~300 el ile doğrulanmış oyuncu (Süper Lig ağırlıklı) + Wikidata ölçekleme
  scripti
- TR/EN arayüz, koyu tema, tamamen çevrimdışı

## Geliştirme

```bash
npm install
npm start            # Expo dev server (Expo Go ile test)
npm test             # motor birim testleri (15 test)
npm run typecheck    # tsc --noEmit
```

## Mimari

```
src/
  data/       kulüpler, ülkeler, oyuncu veritabanı (saf veri)
  engine/     oyun motoru: grid üretimi, kurallar, bot, arama (saf TS, testli)
  components/ Board, PlayerSearchSheet, CriterionChip
  screens/    Home, Game
scripts/      wikidata-import.mjs — veritabanını binlerce oyuncuya büyütür
docs/         analiz, lansman planı, gizlilik politikası
test/         node:test ile motor testleri
```

Motor UI'dan tamamen bağımsızdır; Faz 2'de online multiplayer için sunucu
tarafında (Supabase Edge Function) aynen yeniden kullanılabilir.
