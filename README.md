# IronLog – Antrenman kaydı

Telefonda ana ekrandan açılan, Türkçe, internetsiz çalışan, tek kişilik antrenman kayıt uygulaması (PWA).
Sunucu yok; tüm veriler telefonun kendisinde (localStorage) durur.

## Program
Program tek bir dosyada durur: **`program.js`**. Dört seans sırayla döner:
Üst A → Alt A → Üst B → Alt B → Üst A. Bir hareketi, set sayısını, tekrar aralığını ya da
dinlenmeyi değiştirmek için `program.js` içindeki ilgili satırı düzenlemek yeterlidir;
ekranlar bu dosyadan üretilir. Form ipuçları, yedek hareketler, haftalık set hedefleri ve genel kurallar da buradadır.

## Özellikler
- Sıradaki seans otomatik gelir (son tamamlanandan sonraki), elle değiştirilebilir.
- Her sette zorluk hedefi ("1–2 kala", "2 kala", "tükeniş"), geçen sefer ve bugünkü hedef.
- Ağırlık ve tekrar son kayıtla dolu gelir; büyük artı/eksi düğmeleri (makine 4,5 kg, plaka ve dumbbell 2,5 kg), tik ile kayıt, "Geri al".
- Hareketin kendi dinlenme süresiyle sayaç; süpersette ilk hareketten sonra sayaç başlamaz. Sayaç zaman damgasıyla çalışır.
- Öneriler (sadece bilgi): aynı kilo / en küçük adımla artır / önceki ağırlığa dön / ilk hafta notu; hareket başına "büyük ağırlık adımı".
- Kıyas her zaman aynı seans türünün önceki kaydıyla yapılır.
- Yük azaltma anahtarı: kilolar aynı, setler yarıya, her set 3 kala; bu kayıtlar öneri ve gerileme hesabına girmez. Art arda iki seansta gerileme varsa sakin öneri.
- O günlük sıra değiştirme, "bugün yedeğini yap" (ayrı kayıt), kısa seans, isteğe bağlı crunch'ı atlama.
- Kalıcı makine ayarı notu, seans notu, ısınma setlerinin kilo olarak hesaplanması (kaydedilmez).
- Yarım seans kaybolmaz ("Seansa devam et"); geçmiş seanslar düzeltilebilir.
- Takip: haftalık özet (seans sayısı, kas grubu başına set / hedef), hareket ilerlemesi, kilo ve haftalık ortalama, bel ölçüsü.
- Veriyi dışa / içe aktarma (JSON), 14 günde bir yedek hatırlatması. Eski programın kayıtları "Arşiv" olarak saklanır.
- Seans ekranında iki görünüm: "Odak" (sadece sıradaki set, büyük "Seti tamamla" düğmesi, otomatik ilerleme) ve "Tüm seans" (bütün hareketlerin listesi).
- Hareket başına ağırlık adımı: "Ayar" kutusundan o makinede artı/eksinin kaç kg değiştireceği ayarlanır.

## Dosyalar
- `index.html`, `styles.css`, `app.js` – uygulama
- `program.js` – antrenman programı (tek kaynak)
- `sw.js` – internetsiz çalışma (önbellek). Dosyaları güncellediğinde içindeki `CACHE` sürümünü artır.
- `manifest.webmanifest`, `icons/` – ana ekran ikonu ve ayarları

## Veri sürümleri
Veri `ironlog.v1` anahtarında, sürüm numaralı biçimde saklanır (şu an 4). Uygulama eski veriyle
açıldığında `migrate()` onu kayıpsız yeni biçime çevirir ve geçiş öncesi kopyayı
`ironlog.backup.pre-v<sürüm>` anahtarında saklar (Veri sekmesinden indirilebilir).

Hareket adları kayıtlarda değil `program.js` içinde tutulur: bir hareketin adını değiştirmek için
yalnızca `name` alanını değiştir, eski kayıtlar yeni adla görünür (kimlik `ex` aynı kalmalı).
Bir hareketi başka bir hareketle değiştirirken yeni bir `ex` kimliği ve yeni bir yuva `key` değeri ver,
eski yuvayı `retiredSlots` altına taşı: eski kayıtlar ayrı hareket olarak kalır, yenisinin geçmişi boş başlar.

## Yayınlama
GitHub → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, klasör: `/ (root)`.
