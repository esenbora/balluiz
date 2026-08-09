# TACTICO – Futbol XOX: Rakip Analizi

*Tarih: 9 Ağustos 2026 · Kaynak: Apple App Store (TR) + Google Play kamuya açık verileri*

## 1. Rakip: TACTICO – Futbol XOX

| Alan | Değer |
|---|---|
| Geliştirici | Muhammet Okumuş (bağımsız) |
| Platform | iOS (App Store) + Android (Google Play) |
| Puan | **3,2 / 5** (233 oy, iOS TR) |
| Sıralama | Soru-Cevap kategorisinde 6. (TR) |
| Model | Ücretsiz + reklam |
| Boyut | 57,9 MB · iOS 15.5+ |
| Sürüm | 1.1.1 (yeni; aktif geliştiriliyor) |

**Özellikleri:** 500+ oyuncu kartı, gerçek zamanlı online düello, joker sistemi, 2v2 modu, scout modu, kariyer geçmişi görüntüleme, albüm/koleksiyon.

### Kullanıcı şikayetleri (yorumlardan)

1. **Performans:** kasma ve telefonun ısınması.
2. **Klavye/arama hataları:** oyuncu adı girerken hata — Türkçe karakter/diakritik eşleşmesi zayıf.
3. **Güncel olmayan kadrolar:** "transferler takip edilip en kısa zamanda eklensin" talebi; 500 kartlık havuz dar.
4. 3,2 yıldız: konsept seviliyor ama uygulama kalitesi beklentinin altında.

### Çıkarım

Konseptin (futbol bilgisi + XOX) talebi kanıtlanmış; kategori TR'de ilk 10'a
girebiliyor. Zayıf nokta **uygulama kalitesi ve veri genişliği**. Yani pazara
"daha iyi yapılmışı" ile girmek için net bir boşluk var.

## 2. Tür ve küresel pazar

- **Tiki Taka Toe** (playfootball.games) — türün viral öncüsü; web + iOS +
  Android. Aynı ekranda, online oda ve rastgele eşleşme modları; "steal"
  (çalma) kuralı türü derinleştiren standart oldu.
- **Footy Tic Tac Toe**, **Missing 11**, **Futbol101** vb. klonlar reklam
  destekli modelle yaşıyor.
- Tür, TR pazarında yerelleşmiş (Süper Lig içerikli) güçlü bir temsilciden
  yoksun — TACTICO bunu deniyor ama kalite açığı var.

## 3. Farklılaşma stratejimiz (bu repo)

| TACTICO zayıflığı | Balluiz çözümü |
|---|---|
| Klavye/arama hataları | Türkçe karakter toleranslı normalize arama: "sukur" → Şükür, "gundogan" → Gündoğan (`src/engine/normalize.ts`, testli) |
| 500 kartlık dar havuz | El ile doğrulanmış çekirdek veri (~300 oyuncu, Süper Lig ağırlıklı) + **Wikidata'dan binlerce oyuncuya ölçekleme scripti** (`scripts/wikidata-import.mjs`, CC0 lisans) |
| Kasma/ısınma | Saf TypeScript motor, ağır render yok; oyun mantığı UI'dan ayrık ve birim testli |
| Sıradan görünüm | Koyu, saha-yeşili premium tema; kulüp renkleriyle rozetler |
| — | Deterministik seed'li grid üretimi → "günün gridi" ve grid paylaşımı için hazır altyapı |

**Oyun kuralları** (tür standardı + iyileştirme): 3×3 grid, satır/sütun
kriterleri (kulüp × kulüp, ülke × kulüp), her hücrede ≥2 çözüm garantisi,
yanlış cevapta sıra rakibe, oyuncu adı maç başına bir kez, 3 çalma hakkı,
30 sn tur süresi, bot 3 zorluk seviyesi (bot yalnızca "adil bilgi" kullanır).

## 4. "Gerçek kullanıcılar" — online multiplayer yolu

MVP bota karşı + aynı telefonda 2 kişi ile çıkar (mağaza onayı için yeterli
ve tamamen offline). Online için önerilen mimari (Faz 2):

1. **Backend:** Supabase (Postgres + Realtime + Auth). Maç durumu tek JSON
   satırı; hamleler Realtime kanalından. Sunucu tarafı doğrulama Edge
   Function ile (motor zaten saf TS — aynen yeniden kullanılır).
2. **Eşleşme:** basit havuz (bekleyen oyuncu kuyruk tablosu) → Elo alanıyla
   genişler.
3. **Kimlik:** anonim auth ile sıfır sürtünmeli başlangıç; App Store için
   "hesap silme" gereksinimi anonim hesapla otomatik karşılanır.
4. **Günün gridi:** herkese aynı seed → sıralama tablosu + paylaşım virali
   (Wordle etkisi).

## 5. Hukuki notlar

- **"TACTICO" adını kullanmayın** — mevcut bir uygulamanın markası. Bu repo
  `Balluiz` adıyla ilerliyor.
- Oyun mekaniği (XOX + kriter eşleşmesi) telif konusu değildir; **kulüp
  logoları ve arma görselleri ise lisanslıdır** — bu yüzden UI'da logo değil
  kulüp rengi + kısaltma rozetleri kullanıyoruz. Kulüp/oyuncu adlarının
  bilgi amaçlı (nominative) kullanımı türdeki tüm oyunların ortak pratiği.
- Oyuncu verisi: Wikidata (CC0). Fotoğraf kullanılmıyor.

## 6. Kaynaklar

- [TACTICO – Futbol XOX (App Store)](https://apps.apple.com/tr/app/tactico-futbol-xox/id6758208278?l=tr)
- [TACTICO (Google Play)](https://play.google.com/store/apps/details?id=com.muhammetokumus.tactico)
- [Tiki Taka Toe (Google Play)](https://play.google.com/store/apps/details?id=com.playfootballgames.tikitakatoe)
- [Tiki-Taka-Toe (web)](https://playfootball.games/footy-tic-tac-toe/)
- [Tiki Taka Toe (App Store)](https://apps.apple.com/us/app/tiki-taka-toe/id6476237985)
