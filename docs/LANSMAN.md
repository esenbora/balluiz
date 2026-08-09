# Lansman Planı — App Store + Google Play

## 0. Ön koşullar (hesaplar)

- [ ] **Apple Developer Program** — 99 $/yıl, [developer.apple.com](https://developer.apple.com/programs/enroll/)
- [ ] **Google Play Console** — 25 $ (tek seferlik), [play.google.com/console](https://play.google.com/console/signup)
- [ ] **Expo hesabı** (EAS Build için ücretsiz başlar) — `npx eas login`

## 1. Derleme (EAS Build — Mac gerekmez)

```bash
npm install -g eas-cli
eas init                         # projeyi Expo hesabına bağlar
eas build --platform ios         # App Store .ipa (imzalamayı EAS yönetir)
eas build --platform android     # Play .aab
eas submit -p ios                # App Store Connect'e yükler
eas submit -p android            # Play Console'a yükler
```

Bundle kimlikleri `app.json` içinde hazır: `com.esenbora.balluiz`
(iOS + Android). Değiştirecekseniz **ilk yüklemeden önce** değiştirin;
sonradan değişmez.

## 2. Mağaza kaydı kontrol listesi

### App Store (App Store Connect)

- [ ] Ad: **Balluiz — Futbol XOX** (30 karakter sınırı)
- [ ] Alt başlık: "Futbol bilgisiyle XOX savaşı"
- [ ] Kategori: Oyunlar > Bilgi Yarışması (ikincil: Spor)
- [ ] Yaş: 4+ (şiddet/kumar yok)
- [ ] Ekran görüntüleri: 6.9" ve 6.5" iPhone zorunlu (simülatörden alın)
- [ ] Gizlilik etiketi: **"Veri Toplanmıyor"** (MVP tamamen offline — büyük
      mağaza avantajı; reklam/analitik eklerseniz güncelleyin)
- [ ] Gizlilik politikası URL'si (zorunlu) — `docs/gizlilik.md` içeriğini
      GitHub Pages'te yayınlayın
- [ ] İhracat uyumluluğu: şifreleme yok → muafiyet işaretle

### Google Play (Play Console)

- [ ] Ad + kısa açıklama (80 kr) + uzun açıklama (aşağıda)
- [ ] Kategori: Oyun > Bilgi Yarışması
- [ ] İçerik derecelendirme anketi (şiddet yok → Herkes/PEGI 3)
- [ ] Veri güvenliği formu: veri toplanmıyor
- [ ] Hedef API düzeyi: Expo SDK 57 güncel gereksinimi karşılar
- [ ] Kapalı test: **12 test kullanıcısı × 14 gün** (yeni bireysel hesaplar
      için zorunlu) — planlamaya bunu dahil edin

## 3. Mağaza metinleri (kopyala-yapıştır)

**Kısa açıklama (TR):**
> Futbol bilginle XOX kazan! Kriterlere uyan futbolcuyu bul, hücreyi kap, 3'lü yap.

**Uzun açıklama (TR):**
> ⚽ Balluiz, futbol bilgisini XOX ile birleştirir. Satır ve sütundaki iki
> kritere birden uyan futbolcuyu bul: "Hem Galatasaray hem Inter'de oynayan
> kim?" Doğru bilirsen hücre senin; üçlüyü tamamlayan kazanır.
>
> • Süper Lig ağırlıklı, sürekli büyüyen oyuncu veritabanı
> • Türkçe karakter dert değil: "sukur" yaz, Şükür'ü bul
> • 3 zorluk seviyeli bot — kolaydan acımasıza
> • Aynı telefonda arkadaşınla kapışma modu
> • Çalma kuralı: rakibin hücresini daha iyi cevapla kap
> • 30 saniyelik tur süresi ile tempolu maçlar
> • Tamamen çevrimdışı, hesap gerektirmez, veri toplamaz

**Anahtar kelimeler (iOS):** futbol,xox,quiz,bilgi,yarışma,süper lig,tiki taka,futbolcu tahmin

## 4. Yol haritası

| Faz | Kapsam | Mağaza etkisi |
|---|---|---|
| **MVP (bu PR)** | Bot + yerel 2 kişi, 9.000+ oyuncu + fotoğraf, TR/EN | İlk yayın; fotoğraflar Commons'tan yüklendiği için gizlilik etiketi yine "veri toplanmıyor" (üçüncü taraf takip yok) |
| **Faz 1.1** | Maç sayısı bazlı veri filtresi (P1350), ses/haptik | Tutundurma (D1/D7) |
| **Faz 2** | Supabase online eşleşme + Elo + sıralama | "Gerçek kullanıcılar" hedefi; anonim auth |
| **Faz 2.1** | AdMob geçişli reklam / reklamsız IAP (₺) | Gelir; gizlilik etiketi güncellenir |
| **Faz 3** | Sezonluk ligler, arkadaş odası, paylaşılabilir sonuç kartı | Viral döngü |

## 5. Veri kalitesi ve büyütme (oyuncu genişliği)

**Mevcut durum:** `scripts/wikidata-import.mjs` 58 kulübün kadrosunu çekti →
13.074 ham kayıt; bilinirlik eşiği (sitelink >= 6) sonrası **9.295 oyunculuk
birleşik havuz**, 6.515'i Wikimedia Commons fotoğraflı.

**Bilinen kısıt (3 bağımsız denetçiyle örneklem doğrulaması yapıldı):**
Wikidata'nın P54 "kulüp üyeliği" alanı altyapı/rezerv dönemlerini de
kapsayabiliyor ve çifte vatandaşlıkta doğum vatandaşlığı gelebiliyor; hatalar
düşük bilinirlikli kayıtlarda yoğun. Alınan önlemler: (1) sitelink eşiği,
(2) grid hücreleri yalnızca "güvenilir havuz" (küratörlü + yüksek bilinirlik)
ile çözülebilir sayılıyor — düşük bilinirlikli kayıt bir hücrenin tek çözümü
olamaz. Faz 1.1'de P1350 (maç sayısı) niteleyicisiyle daha sert filtre önerilir.

### Yeniden çalıştırma

```bash
node scripts/wikidata-import.mjs   # → src/data/players.generated.json
```

- Çıktıdaki IOC ülke kodlarını `clubs.ts` kodlarına maplayin (script çıktısı
  ham bırakır; PR incelemesinde insan onayı önerilir — otomatik veride yanlış
  kariyer kaydı olabilir).
- Üretilen listeyi `PLAYERS` ile birleştirirken `normalize(name)` üzerinden
  tekilleştirin (motorun testleri çift kaydı yakalar).
- Transfer güncellemeleri: sezon başı + ara transfer döneminde script'i
  yeniden çalıştırın — rakibin en büyük şikayeti "güncel değil"di.

## 6. Gizlilik politikası taslağı

`docs/gizlilik.md` dosyasında; uygulama veri toplamadığı için tek sayfa.
Reklam/analitik eklenirse (Faz 2.1) AdMob/Firebase bölümleri eklenmeli.
