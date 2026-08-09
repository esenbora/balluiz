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
| **MVP (bu PR)** | Bot + yerel 2 kişi, 550+ oyuncu, TR/EN | İlk yayın; "veri toplanmıyor" etiketi |
| **Faz 1.1** | Wikidata import ile 2.000+ oyuncu, günün gridi, ses/haptik | Tutundurma (D1/D7) |
| **Faz 2** | Supabase online eşleşme + Elo + sıralama | "Gerçek kullanıcılar" hedefi; anonim auth |
| **Faz 2.1** | AdMob geçişli reklam / reklamsız IAP (₺) | Gelir; gizlilik etiketi güncellenir |
| **Faz 3** | Sezonluk ligler, arkadaş odası, paylaşılabilir sonuç kartı | Viral döngü |

## 5. Veri büyütme (oyuncu genişliği)

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
