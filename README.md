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
- Öneriler (sadece bilgi, kiloyu kendisi değiştirmez):
  - **Kiloyu artır:** önceki aynı seansta ilk set tekrar aralığının üst sınırına ulaştıysa VE son set alt sınırın altına düşmediyse. "Büyük ağırlık adımı" açık hareketlerde ilk setin üst sınırı 2 tekrar geçmesi beklenir. (Eski "bütün setler üst sınırda" kuralı kaldırıldı.)
  - **Önceki ağırlığa dön:** ilk sette alt sınıra ulaşılamadıysa.
  - **Kiloyu koru:** aynı seans türünde 3 seans üst üste artış yoksa sakin bir not; uyarı ya da gerileme sayılmaz. Artış = daha yüksek kilo ya da aynı kiloda herhangi bir sette bir tekrar fazlası.
  - Ağırlık artışından sonraki tekrar düşüşü gerileme sayılmaz. Set hedefi "geçen seferden 1 fazla" olarak gösterilir; hedeftir, zorunlu değildir.
- Ayda bir, kapatılabilir hatırlatma: lat pulldown ve seated row'da son seti tükenişe götürüp "kaç tekrar kaldı" tahminini kontrol et.
- Kıyas her zaman aynı seans türünün önceki kaydıyla yapılır.
- Yük azaltma anahtarı: kilolar aynı, setler yarıya, her set 3 kala; bu kayıtlar öneri ve gerileme hesabına girmez. Art arda iki seansta gerileme varsa sakin öneri.
- O günlük sıra değiştirme, "bugün yedeğini yap" (ayrı kayıt), kısa seans, isteğe bağlı crunch'ı atlama.
- Kalıcı makine ayarı notu, seans notu, ısınma setlerinin kilo olarak hesaplanması (kaydedilmez).
- Yarım seans kaybolmaz ("Seansa devam et"); geçmiş seanslar düzeltilebilir.
- Takip: haftalık özet (seans sayısı, kas grubu başına set / hedef), hareket ilerlemesi, kilo ve haftalık ortalama, bel ölçüsü.
- Veriyi dışa / içe aktarma (JSON), 14 günde bir yedek hatırlatması. Eski programın kayıtları "Arşiv" olarak saklanır.
- Seans ekranında iki görünüm: "Odak" (sadece sıradaki set, büyük "Seti tamamla" düğmesi, otomatik ilerleme) ve "Tüm seans" (bütün hareketlerin listesi).
- Hareket başına ağırlık adımı: "Ayar" kutusundan o makinede artı/eksinin kaç kg değiştireceği ayarlanır.
- Plaka hesaplayıcı (plakayla yüklenen hareketler: Smith machine bench press, Smith machine incline bench press, Leg press): kilo kutusunun altında "Her yana: 20 + 5 + 2,5" satırı. "Ayar" kutusunda boş bar / kızak ağırlığı ve salondaki plakalar (20, 15, 10, 5, 2,5, 1,25) kalıcı olarak ayarlanır. Bar ağırlığı girildiyse yazılan kilo toplam sayılır: her yana (kilo − bar) ÷ 2; boşsa yazılan kilo sadece plakalardır: her yana kilo ÷ 2. Tam tutmuyorsa en yakın alt birleşim ve eksik miktar gösterilir. Isınma kiloları da aynı hesapla verilir. Eski kayıtlar dönüştürülmez.
- Anlık rekor: bir set tamamlanınca aynı hareketin (yedek ayrı) önceki seanslardaki ve bu seanstaki bütün tamamlanmış setleriyle kıyaslanır; yük azaltma seansları sayılmaz. Rekor = o güne kadarki en yüksek kilo ya da bu kiloda veya daha ağırında yapılmış en çok tekrardan fazlası (vücut ağırlığında: tek sette en çok tekrar). Hareketin önceki seanslarda kaydı yoksa rekor olmaz. Set satırında, odak şeridinde, bildirimde, seans özetinde ve Geçmiş'te "Rekor" olarak görünür. Kaydedilmez; her seferinde geçmişten hesaplanır.
- Tekrar aralığı çubuğu: her setin altında sol ucu alt, sağ ucu üst tekrar sınırı olan ince çubuk (büyük ağırlık adımı açıksa sağ uç üst sınır + 2). Dolu nokta bugünkü tekrar, içi boş işaret geçen seferki tekrardır (kilo farklıysa gizlenir). Hareketin setleri bitince artırma koşulu sağlandıysa (ilk set üst sınırda, son set alt sınırın altında değil) kartta "gelecek sefer kiloyu artır" satırı çıkar; kural, sonraki seansın artırma önerisiyle aynıdır. Yük azaltma seansında ve düzenleme modunda gösterilmez.
- Kilo eğilimi (Takip, "Günlük" görünüm): günlük noktaların üzerine yumuşatılmış eğilim çizgisi ve "Son 4 hafta: haftada −0,5 kg" satırı. Açma/kapama tercihi yedeğe girmeyen `ironlog.chart` anahtarında tutulur.

## Kilo eğilimi nasıl hesaplanır
Yöntem: üstel hareketli ortalama (EMA). Günlük katsayı **α = 0,2** (yaklaşık 9 günlük ortalamaya denk; `app.js` içinde `TREND_ALPHA`).

- İlk kayıtta eğilim = o günün kilosu.
- Sonraki her kayıtta: `eğilim = eğilim + k × (kilo − eğilim)`, `k = 1 − (1 − α)^g`; `g` bir önceki kayıttan bu yana geçen gün sayısıdır.
  Art arda günlerde `k = 0,2`; arada kayıtsız günler varsa `k` büyür (3 gün için 0,49), yani eksik günler hesabı bozmaz.
- Eğilim her zaman bütün kayıtlardan hesaplanır; grafikte seçilen aralık yalnızca gösterimi süzer.
- "Son 4 hafta" satırı: son 28 gündeki ilk ve son kaydın eğilim değerleri arasındaki fark, aradaki gün sayısına bölünüp 7 ile çarpılır.
  Bu aralıkta 6'dan az kayıt varsa ya da kayıtlar en az 14 güne yayılmamışsa "Eğilim için birkaç hafta daha kayıt gerekiyor" yazar.

## Hareket ayarı alanları
`exSettings[hareket]` = `{ bigStep, note, step, bar, plates }`. Bütün alanlar tek bir fonksiyonda (`normCfg`) tanımlıdır;
açılışta (`migrate`), yedekten geri yüklemede ve her kayıtta aynı fonksiyon kullanılır. Yeni alan eklenecekse yalnızca oraya eklenir,
yoksa uygulama açılışta o alanı siler. `bar` boşsa `null`, bütün plakalar açıksa `plates` `null` olur.

## Dosyalar
- `index.html`, `styles.css`, `app.js` – uygulama
- `program.js` – antrenman programı (tek kaynak)
- `sw.js` – internetsiz çalışma (önbellek). Dosyaları güncellediğinde içindeki `CACHE` sürümünü artır.
- `manifest.webmanifest`, `icons/` – ana ekran ikonu ve ayarları

## Veri sürümleri
Veri `ironlog.v1` anahtarında, sürüm numaralı biçimde saklanır (şu an 5). Uygulama eski veriyle
açıldığında `migrate()` onu kayıpsız yeni biçime çevirir ve geçiş öncesi kopyayı
`ironlog.backup.pre-v<sürüm>` anahtarında saklar (Veri sekmesinden indirilebilir).

Hareket adları kayıtlarda değil `program.js` içinde tutulur: bir hareketin adını değiştirmek için
yalnızca `name` alanını değiştir, eski kayıtlar yeni adla görünür (kimlik `ex` aynı kalmalı).
Bir hareketi başka bir hareketle değiştirirken yeni bir `ex` kimliği ve yeni bir yuva `key` değeri ver,
eski yuvayı `retiredSlots` altına taşı: eski kayıtlar ayrı hareket olarak kalır, yenisinin geçmişi boş başlar.

## 13 Kasım program güncellemesi (veri sürümü 5)
- Alt A: Leg press, Leg extension (yeni), Seated leg curl, Cable lateral raise, süperset, Crunch. Alt B: Leg extension, Leg press (yeni), Seated leg curl, Dumbbell lateral raise, süperset, Crunch.
- Calf raise programdan çıktı (`retiredSlots` altında, `retired: true`). Eski kayıtları Geçmiş'te, düzenlemede ve hareket ilerlemesi listesinde durur. Baldır haftalık hedefi kaldırıldı; ön bacak hedefi 14.
- Tek eklemli hareketlerde ve süperset turu sonunda dinlenme 90 sn.
- Kayıtların hiçbiri değiştirilmez. Uygulama eski veriyle ilk açıldığında verinin birebir kopyasını `ironlog.backup.pre-v5` anahtarına yazar (Veri sekmesinden indirilebilir) ve hangi kaydın hangi ada bağlı olduğunun dökümünü ana ekranda gösterir.
- Yeni alan: `estCheckAt` (aylık hatırlatmanın son kapatıldığı zaman).

## Yayınlama
GitHub → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, klasör: `/ (root)`.
