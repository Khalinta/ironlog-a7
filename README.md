# IronLog – Gym Takip

Telefonda kullanmak için Türkçe, internetsiz çalışan, sade bir antrenman takip uygulaması (PWA).
Sunucu yok; tüm veriler telefonun kendisinde (localStorage) durur.

## Özellikler
- A / B günleri sırayla otomatik gelir, elle değiştirilebilir.
- Her set için ağırlık + tekrar, tik ile tamamlama; tik atınca dinlenme sayacı başlar (2 dk / 90 / 75 / 60 sn).
- Süperset desteği: ilk hareketten sonra dinlenme yok, ikisi bitince dinlenme sayacı başlar.
- Her hareketin son ağırlık ve tekrarı görünür, ağırlıklar otomatik önerilir.
- Ağırlık artırma: tüm setler üst sınırda → "En küçük ağırlık adımını ekle"; alt sınıra ulaşılamazsa önceki ağırlık önerilir.
- 8 haftalık plan: ana / yardımcı / eklenen hareket set sayıları ve kalan tekrar hedefi haftaya göre değişir.
- Elle açılan "Bu hafta yük azalt" seçeneği (ağırlık ~%20 az, setler yarıya, 4 tekrar kala).
- Isınma, hazırlık seti notu, kardiyo, antrenman süresi (hedef ~60 dk).
- Takip: kilo + haftalık ortalama, iki haftada bir bel ölçüsü, ana hareketlerde güç geçmişi.
- Form ipucu, güvenlik notları ve alternatif hareket açılıp kapanır.
- JSON yedek dışa / içe aktarma (eski sürüm yedekleri de okunur).

## Dosyalar
- `index.html`, `styles.css`, `app.js` – uygulama
- `sw.js` – internetsiz çalışma (önbellek). Dosyaları güncellediğinde içindeki `CACHE` sürümünü artır.
- `manifest.webmanifest`, `icons/` – ana ekran ikonu ve ayarları

## Yayınlama
GitHub → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, klasör: `/ (root)`.
