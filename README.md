# IronLog – Gym Takip

Telefonda kullanmak için Türkçe, internetsiz çalışan, sade bir antrenman takip uygulaması (PWA).
Sunucu yok; tüm veriler telefonun kendisinde (localStorage) durur.

## Özellikler
- A / B günleri sırayla otomatik gelir, elle değiştirilebilir.
- Her set için ağırlık + tekrar, tik ile tamamlama; tik atınca dinlenme sayacı başlar (90 / 60 sn).
- Her hareketin son ağırlık ve tekrarı görünür, ağırlıklar otomatik önerilir.
- Tüm setler üst tekrar sınırına ulaşınca "sonraki antrenmanda ağırlığı artır" uyarısı.
- Form ipucu ve alternatif hareket açılıp kapanır.
- 8 haftalık plan: set sayısı ve kardiyo süresi seçilen haftaya göre değişir; 4. ve 8. haftalarda ağırlıklar %20 düşük önerilir.
- 5 dk ısınma ve kardiyo adımları (sayaçlı).
- JSON yedek dışa / içe aktarma.

## Dosyalar
- `index.html`, `styles.css`, `app.js` – uygulama
- `sw.js` – internetsiz çalışma (önbellek). Dosyaları güncellediğinde içindeki `CACHE` sürümünü artır.
- `manifest.webmanifest`, `icons/` – ana ekran ikonu ve ayarları

## Yayınlama
GitHub → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, klasör: `/ (root)`.
