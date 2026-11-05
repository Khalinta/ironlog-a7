# IronLog – Gym Takip

Telefonda kullanmak için Türkçe, internetsiz çalışan, sade bir antrenman takip uygulaması (PWA).
Sunucu yok; tüm veriler telefonun kendisinde (localStorage) durur.

## Özellikler
- A / B günleri sırayla otomatik gelir, elle değiştirilebilir.
- Her set için ağırlık + tekrar, tik ile tamamlama; tik atınca dinlenme sayacı başlar (90 / 75 / 60 sn).
- Her hareketin son ağırlık ve tekrarı görünür, ağırlıklar otomatik önerilir.
- Tüm setler tekrar aralığının üst sınırına ulaşınca sonraki antrenmanda "En küçük ağırlık adımını ekle" önerisi; yeni ağırlıkta hedef aralığın altı.
- 8 haftalık plan: ana / küçük / eklenen hareket set sayıları ve kalan tekrar hedefi haftaya göre değişir; eklenen hareketler 5. haftadan itibaren.
- Elle açılan "Bu hafta yük azalt" seçeneği (ağırlık hedefi ~%20 düşük, set sayısı yarıya, kalan tekrar 4).
- 5 dk ısınma, ilk iki hareket için hazırlık seti notu, 10 dk kardiyo.
- Kilo kaydı ve haftalık ortalama, iki haftada bir bel ölçüsü.
- Form ipucu ve alternatif hareket açılıp kapanır.
- JSON yedek dışa / içe aktarma (eski sürüm yedekleri de okunur).

## Dosyalar
- `index.html`, `styles.css`, `app.js` – uygulama
- `sw.js` – internetsiz çalışma (önbellek). Dosyaları güncellediğinde içindeki `CACHE` sürümünü artır.
- `manifest.webmanifest`, `icons/` – ana ekran ikonu ve ayarları

## Yayınlama
GitHub → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, klasör: `/ (root)`.
