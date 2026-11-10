'use strict';
/* =====================================================================
   IronLog – ANTRENMAN PROGRAMI (tek kaynak)
   Kaynak: "4 günlük Üst/Alt antrenman programım" dokümanı.
   Bir hareketi, set sayısını, tekrar aralığını ya da dinlenmeyi değiştirmek için
   sadece bu dosyadaki ilgili satırı düzenle. Uygulamanın ekranları bu veriden üretilir.

   Zorluk kodları (effort):
     rir12    = her set 1–2 tekrar kala
     rir2     = her set 2 tekrar kala
     lastFail = önceki setler 1–2 tekrar kala, son set tükeniş
   rest: setler arası dinlenme (saniye). Süpersette tur sonunda uygulanır.
   ss / ssPos: süperset grubu ve sırası (1 = önce, 2 = sonra; 1'den sonra dinlenme yok).
   ===================================================================== */

const PROGRAM = {
  version: 1,
  name: '4 günlük Üst/Alt',

  /* Seanslar bu sırayla döner; son tamamlanan seanstan sonraki gelir. */
  rotation: ['UA', 'LA', 'UB', 'LB'],

  /* Ağırlık adımları (artı/eksi düğmeleri). load: machine | plate | dumbbell | bodyweight */
  loadSteps: {
    machine: { unit: 'kg', step: 4.5 },   // makinelerdeki 10 lbs ≈ 4,5 kg
    plate: { unit: 'kg', step: 2.5 },     // plaka takılan aletler (Smith): her yana 1,25 kg
    dumbbell: { unit: 'kg', step: 2.5 },
    bodyweight: null,
  },

  effortLabels: { rir12: '1–2 kala', rir2: '2 kala', fail: 'tükeniş', deload: '3 kala' },

  sessions: {
  "UA": {
    "name": "Üst A",
    "about": "Göğüs, sırt, omuz ve kol. 21 çalışma seti, yaklaşık 70 dakika. Hareketleri yazılı sırayla yap.",
    "slots": [
      {
        "key": "ua1",
        "ex": "chestpress",
        "sets": 4,
        "reps": [
          6,
          10
        ],
        "effort": "rir12",
        "rest": 150,
        "warmup": {
          "sets": true,
          "text": "Seansın ilk hareketi: 2 ısınma seti. Yarı kiloyla 8–10 tekrar, 1 dakika dinlenme, sonra yaklaşık dörtte üç kiloyla 3–5 tekrar. İkisi de kolay olmalı; amaç yorulmak değil, hareketi provalamak."
        }
      },
      {
        "key": "ua2",
        "ex": "latpulldown",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "rir12",
        "rest": 120,
        "warmup": {
          "text": "İtişten çekişe geçtiğin için yarı kiloyla 6–8 tekrarlık tek set."
        }
      },
      {
        "key": "ua3",
        "ex": "seatedrow",
        "sets": 2,
        "reps": [
          8,
          12
        ],
        "effort": "rir12",
        "rest": 120
      },
      {
        "key": "ua4",
        "ex": "dblateral",
        "sets": 3,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "ua5",
        "ex": "revpecdeck",
        "sets": 3,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "ua6a",
        "ex": "inclinecurl",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "ua6",
        "ssPos": 1
      },
      {
        "key": "ua6b",
        "ex": "ohext",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "ua6",
        "ssPos": 2
      }
    ]
  },
  "LA": {
    "name": "Alt A",
    "about": "Bacak, baldır, yan omuz, kol ve isteğe bağlı karın. 21 çalışma seti, yaklaşık 65–70 dakika.",
    "slots": [
      {
        "key": "la1",
        "ex": "legpress",
        "sets": 4,
        "reps": [
          8,
          12
        ],
        "effort": "rir2",
        "rest": 150,
        "warmup": {
          "sets": true,
          "text": "Seansın ilk hareketi: 2 ısınma seti. Yarı kiloyla 8–10 tekrar, 1 dakika dinlenme, sonra yaklaşık dörtte üç kiloyla 3–5 tekrar. İkisi de kolay olmalı; amaç yorulmak değil, hareketi provalamak."
        },
        "effortNote": "Tükenişe gitme; bu harekette tükeniş hem çok yorar hem de ağırlığın altında kalma riski taşır."
      },
      {
        "key": "la2",
        "ex": "legcurl",
        "sets": 4,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "la3",
        "ex": "calf",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "la4",
        "ex": "cablelateral",
        "sets": 3,
        "reps": [
          12,
          15
        ],
        "effort": "lastFail",
        "rest": 60,
        "warmup": {
          "text": "Bacaktan omuza geçtiğin için çok hafif kiloyla 8–10 tekrarlık tek set."
        },
        "restNote": "İki kolu arka arkaya yap, sonra 1 dakika dinlen."
      },
      {
        "key": "la5a",
        "ex": "preacher",
        "sets": 2,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "la5",
        "ssPos": 1
      },
      {
        "key": "la5b",
        "ex": "pushdown",
        "sets": 2,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "la5",
        "ssPos": 2
      },
      {
        "key": "la6",
        "ex": "crunch",
        "sets": 3,
        "reps": [
          15,
          20
        ],
        "effort": "rir12",
        "rest": 60,
        "optional": true
      }
    ]
  },
  "UB": {
    "name": "Üst B",
    "about": "Üst A'nın karşılığı: göğüste açı değişiyor, sırtta row öne geçiyor, kol hareketleri yer değiştiriyor. 21 çalışma seti, yaklaşık 70 dakika.",
    "slots": [
      {
        "key": "ub1",
        "ex": "smithincline",
        "sets": 4,
        "reps": [
          8,
          12
        ],
        "effort": "rir12",
        "rest": 150,
        "warmup": {
          "sets": true,
          "emptyBar": true,
          "text": "Seansın ilk hareketi: önce boş barla 8–10 tekrar, sonra çalışma kilonun yaklaşık dörtte üçüyle 3–5 tekrar."
        },
        "effortNote": "Tükenişe gitme; bar göğsünün üzerinde."
      },
      {
        "key": "ub2",
        "ex": "seatedrow",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "rir12",
        "rest": 120,
        "warmup": {
          "text": "İtişten çekişe geçtiğin için yarı kiloyla 6–8 tekrarlık tek set."
        },
        "note": "Bu seansta çekişlerin ilki olduğu için Üst A'ya göre biraz daha ağır ya da daha çok tekrar çıkarabilirsin; bu normal. İki seansın kayıtlarını ayrı tut."
      },
      {
        "key": "ub3",
        "ex": "latpulldown",
        "sets": 2,
        "reps": [
          8,
          12
        ],
        "effort": "rir12",
        "rest": 120,
        "note": "İstersen bu seansta avuçların birbirine baktığı dar tutamaçla yap; aynı kası biraz farklı açıdan çalıştırır. Hangisini seçersen her Üst B'de onu kullan."
      },
      {
        "key": "ub4",
        "ex": "cablelateral",
        "sets": 3,
        "reps": [
          12,
          15
        ],
        "effort": "lastFail",
        "rest": 60,
        "restNote": "İki kolu arka arkaya yap, sonra 1 dakika dinlen."
      },
      {
        "key": "ub5",
        "ex": "revpecdeck",
        "sets": 3,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "ub6a",
        "ex": "preacher",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "ub6",
        "ssPos": 1,
        "note": "Preacher curl'de ağırlığı altta kontrollü açmayı unutma."
      },
      {
        "key": "ub6b",
        "ex": "pushdown",
        "sets": 3,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "ub6",
        "ssPos": 2
      }
    ]
  },
  "LB": {
    "name": "Alt B",
    "about": "Alt A'nın karşılığı: ön bacakta leg press yerine leg extension var, yan omuzda dumbbell, kolda incline curl ve baş üstü triceps. 21 çalışma seti, yaklaşık 60–65 dakika.",
    "slots": [
      {
        "key": "lb1",
        "ex": "legext",
        "sets": 4,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 90,
        "warmup": {
          "sets": true,
          "text": "Seansın ilk hareketi: yarı kiloyla 10 tekrar, sonra dörtte üç kiloyla 5 tekrar."
        }
      },
      {
        "key": "lb2",
        "ex": "legcurl",
        "sets": 4,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75
      },
      {
        "key": "lb3",
        "ex": "calf",
        "sets": 3,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "note": "Altta 1–2 saniye beklemeyi atlama."
      },
      {
        "key": "lb4",
        "ex": "dblateral",
        "sets": 3,
        "reps": [
          10,
          15
        ],
        "effort": "lastFail",
        "rest": 75,
        "warmup": {
          "text": "Bacaktan omuza geçtiğin için çok hafif kiloyla 8–10 tekrarlık tek set."
        }
      },
      {
        "key": "lb5a",
        "ex": "inclinecurl",
        "sets": 2,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "lb5",
        "ssPos": 1
      },
      {
        "key": "lb5b",
        "ex": "ohext",
        "sets": 2,
        "reps": [
          8,
          12
        ],
        "effort": "lastFail",
        "rest": 75,
        "ss": "lb5",
        "ssPos": 2
      },
      {
        "key": "lb6",
        "ex": "crunch",
        "sets": 3,
        "reps": [
          15,
          20
        ],
        "effort": "rir12",
        "rest": 60,
        "optional": true
      }
    ]
  }
},

  exercises: {
  "chestpress": {
    "name": "Chest press makinesi",
    "muscle": "Göğüs",
    "load": "machine",
    "sub": "Başka bir chest press makinesi ya da Smith makinesinde düz sehpada press",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Göğüs (ana), ön omuz ve triceps (yardımcı)",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Koltuğu, tutamaçlar göğsünün orta hizasına gelecek şekilde ayarla. Tutamaçlar omuz hizasındaysa koltuk fazla alçaktır. Sırtın ve kalçan yastığa tam yaslansın, ayakların yere bassın. Makinede başlangıç pozisyonunu ayarlayan bir kol ya da pedal varsa, ellerin göğsünün hemen önünde başlayacak şekilde ayarla.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kürek kemiklerini hafifçe geriye ve aşağıya çek, göğsünü öne çıkar. Bu pozisyonu set boyunca koru.",
          "Tutamaçları ileri doğru it. Dirsekler tam kilitlenmeden hemen önce dur.",
          "2–3 saniyede geri getir. Ellerin göğsünün yanına gelene, göğsünde belirgin bir gerilme hissedene kadar in.",
          "Altta sektirmeden yeniden it."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Omuzları kulağa doğru kaldırmak, sırtı yastıktan ayırıp öne atılmak, hareketi yarıda kesip ağırlığı geri tam indirmemek. Dirsekler gövdeye göre yaklaşık 45–60 derece açık olmalı; tam yana açık dirsek omzu zorlar.",
        "steps": []
      }
    ]
  },
  "smithincline": {
    "name": "Smith makinesinde incline press",
    "muscle": "Göğüs",
    "load": "plate",
    "sub": "Eğimli sehpada dumbbell press",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Göğsün üst kısmı (ana), ön omuz ve triceps (yardımcı)",
        "steps": []
      },
      {
        "label": "Smith makinesi nedir",
        "text": "Barın iki yandaki raylara bağlı olduğu, sadece yukarı aşağı hareket ettiği alet. Barı bileğinle öne ya da arkaya çevirince kancalar raydaki dişlere takılır ya da çıkar. Dengeyi makine sağladığı için serbest bardan kolaydır.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "",
        "steps": [
          "Ayarlı bir sehpayı Smith makinesinin ortasına yerleştir ve sırt kısmını yaklaşık 30 dereceye getir (genelde yataydan sonraki 2. ya da 3. kademe). 45 derecenin üstünde yük göğüsten omuza kayar.",
          "Sehpaya yat ve boş barı indir. Bar, köprücük kemiklerinin 2–3 parmak altına, üst göğsüne inmeli. Boyna ya da karna doğru iniyorsa sehpayı ileri geri kaydır.",
          "Makinenin emniyet durdurucuları varsa, bar göğsüne değdiği noktanın hemen altına ayarla. Kaldıramadığın bir tekrarda bar orada durur.",
          "Barı omuz genişliğinden bir karış geniş tut. Bar altta iken ön kolların yere dik olmalı."
        ]
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kürek kemiklerini geriye ve aşağıya çekip sehpaya bastır, göğsünü yukarı çıkar. Ayaklar yerde sağlam.",
          "Barı yukarı itip bileğinle çevirerek kancadan kurtar.",
          "2–3 saniyede üst göğsüne indir. Bar göğse hafifçe değsin ya da 1–2 santim üstünde dursun.",
          "Sektirmeden yukarı it. Dirsekler tam kilitlenmeden dur.",
          "Son tekrardan sonra barı üstte bileğinle çevirip kancaya tak. Takıldığından emin olmadan ellerini bırakma."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Sehpayı fazla dik ayarlamak, dirsekleri tam yana açmak (gövdeye göre 45–60 derece olmalı), kalçayı sehpadan kaldırmak, barı göğüste sektirmek, hareketi yarım yapmak.",
        "steps": []
      },
      {
        "label": "İlk seans için",
        "text": "Boş Smith barının ağırlığı makineye göre değişir (kabaca 7–20 kg). Hesap yapmana gerek yok; defterine sadece taktığın plakaları yaz ve hep aynı makineyi kullan.",
        "steps": []
      }
    ]
  },
  "latpulldown": {
    "name": "Lat pulldown",
    "muscle": "Sırt",
    "load": "machine",
    "sub": "Farklı bir pulldown makinesi ya da destekli barfiks makinesi",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Sırtın geniş kası latissimus dorsi (ana), biceps ve arka omuz (yardımcı)",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Diz yastığını, uylukların sıkıca altında kalacak şekilde ayarla; ağır kiloda seni yerinde tutan şey bu. Çubuğu omuz genişliğinden biraz geniş, avuçlar karşıya bakacak şekilde tut.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kollar tam uzamışken başla; koltuk altlarında gerilme hissetmelisin.",
          "Gövdeni çok hafif geriye yatır (yaklaşık 10–15 derece) ve bu açıyı sabit tut.",
          "Dirsekleri aşağıya, kalçana doğru çektiğini düşünerek çubuğu üst göğsüne indir.",
          "2–3 saniyede kollar tam uzayana kadar geri bırak."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Gövdeyi her tekrarda geriye savurup kiloyu sırtla değil momentumla çekmek, çubuğu ensenin arkasına indirmek, yukarıda kolları tam uzatmamak. Elinle çekmeye değil dirseğinle çekmeye odaklanırsan yük kollardan sırta kayar.",
        "steps": []
      }
    ]
  },
  "seatedrow": {
    "name": "Oturarak row",
    "muscle": "Sırt",
    "load": "machine",
    "sub": "Diğer row makinesi ya da kablo row",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Orta sırt (kürek kemikleri arasındaki kaslar ve trapez), latissimus, biceps ve arka omuz",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Makinedeyse göğüs yastığını, kolların tam uzandığında tutamaçlara ancak yetişeceğin şekilde ayarla. Kablodaysa ayakları platforma bas, dizler hafif bükülü, sırt dik. Avuçların birbirine baktığı dar tutamaç başlamak için en kolayı.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kollar uzamış, kürek kemikleri öne doğru açılmış başla.",
          "Önce kürek kemiklerini geriye çek, sonra dirsekleri gövdenin yanından geriye götür.",
          "Tutamaç karnının üst kısmına geldiğinde kürek kemiklerini sıkıp 1 saniye bekle.",
          "2–3 saniyede kollar tam uzayana ve kürek kemikleri yeniden açılana kadar geri bırak."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Belden öne arkaya sallanmak, omuzları kulağa kaldırmak, tutamaçları gövdeye değdirmeden yarım çekmek. Gövden set boyunca dik ve sabit kalmalı.",
        "steps": []
      }
    ]
  },
  "dblateral": {
    "name": "Dumbbell lateral raise",
    "muscle": "Yan omuz",
    "load": "dumbbell",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Yan omuz (deltoidin orta kısmı). Omuz genişliğini veren kas bu.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Ayakta, ayaklar kalça genişliğinde, dumbbell'lar yanlarda. Gövdeni çok hafif öne eğ. Beklediğinden hafif bir kiloyla başla; bu hareket kolayca hileye kaçıyor.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Dirsekler hafif bükülü ve bu açı sabit.",
          "Kolları yana ve çok hafif öne doğru, omuz hizasına kadar kaldır. Elini değil dirseğini kaldırdığını düşün.",
          "Üstte el, dirsek ve omuz aynı hizada olsun. Eller dirsekten yüksekte olmasın.",
          "2–3 saniyede indir. Aşağıda kolları gövdeye yapıştırıp dinlenme; hemen sonraki tekrara geç."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dizlerden ve belden yaylanarak kiloyu savurmak, omuzları kulağa doğru silkmek (yük trapeze kayar), omuz hizasının çok üstüne çıkmak. Son setin sonunda form bozulmaya başladığında seti bitir.",
        "steps": []
      }
    ]
  },
  "cablelateral": {
    "name": "Kablo lateral raise",
    "muscle": "Yan omuz",
    "load": "machine",
    "perSide": true,
    "sub": "Dumbbell lateral raise",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Yan omuz. Dumbbell'da kol aşağıdayken yük neredeyse sıfırdır; kabloda kas aşağıda da yük altında kalır.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Makarayı en alta ya da el bileği hizasına indir, tek elle tutulan sapı tak. Makineye yan dur; çalışan kol makineden uzak tarafta olsun, kablo vücudunun önünden geçsin. Boş elinle makineyi tut. Çok hafif başla; bu harekette en küçük plaka bile ilk gün yeterli olabilir.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "El karşı kalçanın önünde, dirsek hafif bükülü başla.",
          "Kolu yana doğru omuz hizasına kadar kaldır. Dirseği kaldırdığını düşün.",
          "2–3 saniyede başlangıca indir.",
          "Bir kolun tekrarları bitince yön değiştirip diğer kolu yap."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Gövdeyi makineden uzağa yatırıp savurmak, omzu kulağa silkmek, kolu omuz hizasının üstüne çıkarmak. İlk hafta denedikten sonra sevmezsen bu hareketi de dumbbell lateral raise ile değiştirebiliriz; set ve tekrar aynı kalır.",
        "steps": []
      }
    ]
  },
  "revpecdeck": {
    "name": "Reverse pec deck",
    "muscle": "Arka omuz",
    "load": "machine",
    "sub": "Göğsün eğimli sehpaya dayalıyken dumbbell ile reverse fly",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Arka omuz (ana), kürek kemikleri arasındaki kaslar (yardımcı)",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Kelebek (pec deck) makinesine yüzün yastığa dönük otur. Kolların başlangıç pozisyonunu ayarlayan pimleri en arkaya al; böylece kollar önde, birbirine yakın başlar. Koltuğu, tutamaçlar omuz hizasına gelecek şekilde ayarla. Göğsün yastığa dayalı kalsın.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kollar önde, dirsekler hafif bükülü başla.",
          "Kolları geniş bir yay çizerek yanlara ve geriye aç. Hareketi dirsekle yönlendir.",
          "Kollar gövdenle aynı hizaya geldiğinde dur; daha geriye zorlamana gerek yok.",
          "2–3 saniyede kollar önde buluşana kadar geri getir."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Kürek kemiklerini sıkıca birbirine çekmek (yük arka omuzdan orta sırta kayar), göğsü yastıktan ayırmak, fazla ağır kiloyla hareketi yarım yapmak. Kürek kemikleri görece sabit kalırsa arka omuzda yanma hissedersin.",
        "steps": []
      }
    ]
  },
  "inclinecurl": {
    "name": "Incline dumbbell curl",
    "muscle": "Biceps",
    "load": "dumbbell",
    "sub": "Alçak makaradan kablo curl",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Biceps. Kol geride olduğu için kas gerilmiş pozisyonda çalışıyor.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Ayarlı sehpayı yaklaşık 45–60 derece eğime getir. Sırtın ve başın sehpaya yaslı otur, kolları omuzdan aşağıya serbestçe sarkıt. Avuçlar karşıya baksın.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Dirsekler gövdenin biraz gerisinde ve sabit.",
          "Sadece ön kolu hareket ettirerek dumbbell'ları omuza doğru kıvır.",
          "Üstte 1 saniye sık.",
          "2–3 saniyede kol tam uzayana kadar indir. Altta biceps'te gerilme hissetmelisin."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dirsekleri öne taşımak (gerilme kaybolur), omuzları sehpadan kaldırmak, altta kolu tam açmamak. Bu hareket ayakta curl'den belirgin daha hafif kiloyla yapılır; bu normal.",
        "steps": []
      }
    ]
  },
  "preacher": {
    "name": "Preacher curl",
    "muscle": "Biceps",
    "load": "dumbbell",
    "sub": "Incline dumbbell curl ya da kablo curl",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Biceps ve altındaki brakiyalis. Üst kol sehpaya sabitlendiği için hile yapmak zor.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Preacher sehpasının koltuğunu, koltuk altların yastığın üst kenarına oturacak şekilde ayarla. Üst kolların arkası yastığa tam yaslı olsun. EZ bar (kıvrımlı kısa bar) varsa onu, iç kıvrımlardan omuz genişliğinde tut; bileği düz bardan daha az zorlar. Yoksa iki dumbbell ya da tek kol sırayla.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kollar neredeyse tam açık başla. Dirseği sertçe kilitleme.",
          "Barı omuzlara doğru kıvır. Üst kol yastıktan ayrılmasın.",
          "Ön kol dik konuma gelmeden hemen önce dur; daha yukarıda kasın üzerindeki yük kalkar.",
          "3 saniyede kontrollü indir."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Altta ağırlığı hızla bırakıp dirseği sertçe açmak (bu harekette sakatlık riski olan tek nokta burası), kalçayı koltuktan kaldırıp gövdeyle çekmek, dirsekleri yastıktan kaldırmak. Ayakta curl'den daha hafif kiloyla başla.",
        "steps": []
      }
    ]
  },
  "ohext": {
    "name": "Baş üstü kablo triceps extension",
    "muscle": "Triceps",
    "load": "machine",
    "sub": "Otururken tek dumbbell'ı iki elle tutup baş üstü extension",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Triceps, özellikle uzun başı. Kol baş üstündeyken uzun baş gerili olduğu için bu pozisyon seçildi.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Kabloya ip (halat) tak, makarayı yaklaşık bel ile göğüs arası yüksekliğe ayarla. Sırtını makineye dön, ipi iki elle tutup başının arkasına al. Bir ayağını öne atıp gövdeni hafifçe öne eğ; bu duruş dengeni sağlar.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Dirsekler başının iki yanında, yukarıyı ve hafifçe önü gösterir; eller ensenin arkasında.",
          "Üst kolu sabit tutarak dirsekleri tam aç, ipi ileri ve yukarı doğru uzat.",
          "Sonda triceps'i 1 saniye sık.",
          "2–3 saniyede eller yeniden ensenin arkasına gelene kadar geri getir. Triceps'te belirgin bir gerilme hissetmelisin."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dirsekleri yanlara açmak, üst kolu her tekrarda öne arkaya oynatmak, beli aşırı çukurlaştırmak. Karnını hafifçe sıkı tutarsan bel sabit kalır.",
        "steps": []
      }
    ]
  },
  "pushdown": {
    "name": "Triceps pushdown",
    "muscle": "Triceps",
    "load": "machine",
    "sub": "Baş üstü triceps extension",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Triceps, ağırlıklı olarak yan ve iç başları. Baş üstü hareketi tamamlıyor.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Makarayı en üste al, ip ya da düz çubuk tak. Makineye dönük dur, bir adım geride, gövde çok hafif öne eğik. Dirsekleri gövdenin yanına sabitle.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Ön kollar yere paralelden biraz yukarıda başla.",
          "Sadece dirsekten açarak aşağı it, kollar tam düzleşsin.",
          "İp kullanıyorsan sonda uçları hafifçe yanlara aç ve 1 saniye sık.",
          "2–3 saniyede geri bırak; ön kol pazuya yaklaşana kadar çık."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dirsekleri öne arkaya oynatmak, gövdeyi ağırlığın üstüne yığıp vücut ağırlığıyla bastırmak, yukarıda hareketi erken kesmek.",
        "steps": []
      }
    ]
  },
  "legpress": {
    "name": "Leg press",
    "muscle": "Ön bacak",
    "load": "plate",
    "sub": "Hack squat makinesi",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Ön bacak (quadriceps) ve kalça (ana), iç bacak (yardımcı)",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Sırtın ve kalçan yastığa tam yaslı otur. Ayakları platformun ortasına, omuz genişliğinde, parmak uçları hafif dışa dönük yerleştir. Emniyet kollarının nerede olduğunu ve nasıl kapandığını başlamadan öğren.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Platformu it, emniyet kollarını aç. Dizler hafif bükülü başla.",
          "2–3 saniyede platformu indir. Dizler ayak parmaklarının yönünü takip etsin.",
          "Kalçan yastıktan kalkmaya başlamadan hemen önce dur. İnebildiğin en derin nokta burası.",
          "Topuk ve ayağın ortasıyla iterek yukarı çık. Dizleri tam kilitlemeden dur.",
          "Son tekrardan sonra emniyet kollarını kapat."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dizleri üstte sertçe kilitlemek, dizleri içe çökertmek, kalçayı yastıktan kaldırıp beli yuvarlamak, çok ağır kiloyla sadece birkaç santim inmek. Elleri dizlere koyup itme; yan tutamaçları tut.",
        "steps": []
      }
    ]
  },
  "legext": {
    "name": "Leg extension",
    "muscle": "Ön bacak",
    "load": "machine",
    "noSub": true,
    "sub": "Yedeği yok; seansın sonuna bırak",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Ön bacak (quadriceps). Leg press'in yeterince çalıştırmadığı rectus femoris kasını da çalıştırıyor; iki hareket birbirini tamamlıyor.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Sırt yastığını, dizlerin makinenin dönme eksenine hizalanacağı ve diz arkan koltuğun kenarına dayanacağı şekilde ayarla. Alt yastık ayak bileğinin hemen üstünde, önde dursun. Başlangıç açısı ayarlanabiliyorsa dizlerin 90 dereceden biraz daha bükülü başlamasını sağla. Yan tutamaçları tut.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Bacakları tam düzleşene kadar kaldır.",
          "Üstte ön bacağı 1 saniye sık.",
          "2–3 saniyede başlangıca indir. Plakaları birbirine vurdurma; değmeden hemen önce sonraki tekrara geç."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Kalçayı koltuktan kaldırmak, ağırlığı savurarak kaldırıp düşürmek, üstte bacakları tam açmamak. Sırt yastığı geriye yatırılabiliyorsa biraz yatırmak rectus femoris'teki gerilmeyi artırır. Diz önünde keskin bir ağrı olursa kiloyu azalt ve daha yavaş indir.",
        "steps": []
      }
    ]
  },
  "legcurl": {
    "name": "Oturarak leg curl",
    "muscle": "Arka bacak",
    "load": "machine",
    "sub": "Yatarak leg curl",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Arka bacak (hamstring). Otururken kalça bükülü olduğu için kas gerili başlıyor; yatarak versiyona göre daha çok büyüme sağlaması buna bağlanıyor.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Sırt yastığını, dizlerin makinenin dönme eksenine (genelde yanda işaretli bir nokta) hizalanacak şekilde ayarla. Alt yastık ayak bileğinin hemen üstünde, arkada dursun. Üst yastığı uylukların üstüne sıkıca indir; uyluklar set boyunca kalkmamalı.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Bacaklar neredeyse düz başla.",
          "Topukları kalçana doğru, makinenin izin verdiği kadar geriye çek.",
          "Sonda 1 saniye sık.",
          "2–3 saniyede bacaklar yeniden uzayana kadar geri bırak."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Kalçayı koltuktan kaldırmak, ağırlığı geri bırakırken düşürmek, bacakları tam uzatmadan yarım tekrar yapmak. Gövdeni hafifçe öne eğersen arka bacaktaki gerilme artar.",
        "steps": []
      }
    ]
  },
  "calf": {
    "name": "Calf raise",
    "muscle": "Baldır",
    "load": "machine",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Baldır (gastroknemius ve soleus)",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Ayakta calf raise makinesi varsa onu kullan. Yoksa leg press'te yap: ayakların sadece ön kısmı (parmak kökleri) platformun alt kenarında, topuklar boşta. Leg press'te emniyet kollarını kapalı tut ya da platformun kayma ihtimaline karşı çok dikkatli ol. Dizler düz ama kilitli değil.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Topukları inebildiği kadar indir; baldırda derin bir gerilme hisset.",
          "Altta 1–2 saniye bekle. Bu harekette en önemli kısım burası.",
          "Parmak uçlarında yükselebildiğin kadar yüksel, üstte 1 saniye sık.",
          "2 saniyede geri in."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Altta zıplayarak sekmek (işi Aşil tendonunun esnekliği yapar, kas değil), hareketi küçük ve hızlı yapmak, dizleri büküp bacakla itmek.",
        "steps": []
      }
    ]
  },
  "crunch": {
    "name": "Yerde crunch",
    "muscle": "Karın (isteğe bağlı)",
    "load": "bodyweight",
    "optional": true,
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Karnın ön kası (rectus abdominis)",
        "steps": []
      },
      {
        "label": "",
        "text": "Vaktin ya da isteğin yoksa atlayabilirsin. Karın kaslarının görünmesi büyük ölçüde yağ oranına bağlı.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "Mat üzerinde sırtüstü yat, dizler bükülü, ayak tabanları yerde. Elleri göğsünde çaprazla ya da parmak uçlarını şakaklarına koy.",
        "steps": []
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Nefes vererek kaburgalarını leğen kemiğine doğru yaklaştır; omuzlar ve üst sırt yerden kalksın.",
          "Bel yerde kalsın. Bu bir mekik değil; tam oturmuyorsun.",
          "Üstte 1 saniye karnını sık.",
          "2 saniyede geri in, omuzları yere tam bırakmadan sonraki tekrara geç."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Elleri ensede kenetleyip başı çekmek (boynu zorlar), hızlı ve sallanarak yapmak. 20 tekrar kolay gelmeye başlayınca göğsünde bir plaka tut.",
        "steps": []
      }
    ]
  }
},

  /* Haftalık set bütçesi (doğrudan setler, hafta toplamı) */
  weeklyTargets: {
  "Yan omuz": 12,
  "Biceps": 10,
  "Triceps": 10,
  "Sırt": 10,
  "Göğüs": 8,
  "Arka omuz": 6,
  "Ön bacak": 8,
  "Arka bacak": 8,
  "Baldır": 6,
  "Karın (isteğe bağlı)": 6
},

  /* Genel kurallar ("Temel kavramlar ve her seansta geçerli kurallar" bölümü) */
  generalRules: [
    {
      "title": "Kelimeler",
      "lines": [
        "Tekrar: Hareketin bir kez tam yapılması. Ağırlığı bir kez kaldırıp indirmek 1 tekrardır.",
        "Set: Ara vermeden arka arkaya yapılan tekrarların tamamı. \"3×8–12\" = 3 set, her biri 8–12 tekrar.",
        "Çalışma seti: Programda sayılan, ciddi eforla yapılan set. Isınma setleri bu sayıya dahil değil.",
        "Tükeniş (failure): Doğru formla bir tekrar daha yapamayacağın nokta.",
        "RIR (kalan tekrar): Seti bıraktığında tükenişe kaç tekrar kaldığı. \"RIR 2\" = iki tekrar daha yapabilirdin. \"RIR 0\" = tükeniş.",
        "Süperset: İki farklı hareketi aralarında dinlenmeden arka arkaya yapmak.",
        "Tekrar aralığı: O harekette hedeflenen en az ve en çok tekrar, örneğin 8–12."
      ]
    },
    {
      "title": "Setleri ne kadar zorlayacaksın",
      "lines": [
        "Varsayılan: RIR 1–2. Seti bitirdiğinde \"bir iki tane daha çıkardı\" diyebilmelisin. Son tekrarlar belirgin yavaşlamalı; yavaşlamıyorsa set hafif kalmıştır.",
        "Tek eklemli hareketlerin son seti: tükeniş. Lateral raise, reverse pec deck, curl, triceps, leg extension, leg curl ve calf raise bu gruba girer. Sadece son sette, formu bozmadan.",
        "Büyük hareketlerde tükeniş yok. Chest press, Smith incline press, leg press, lat pulldown ve row her zaman RIR 1–2'de biter.",
        "Tahminini ayarlamak: İnsanlar kalan tekrarı ortalama 1 tekrar hatayla tahmin ediyor; yeni başlayan ve aradan dönenler genelde erken bırakıyor (Biolayne, Halperin ve ark. özeti). İlk hafta tek eklemli hareketlerin son setinde tükenişe gidip sınırını gör."
      ]
    },
    {
      "title": "Setler arasında dinlenme",
      "table": {
        "head": [
          "Hareket grubu",
          "Dinlenme"
        ],
        "rows": [
          [
            "Chest press, Smith incline press, leg press",
            "2–3 dakika"
          ],
          [
            "Lat pulldown, oturarak row",
            "2 dakika"
          ],
          [
            "Lateral raise, reverse pec deck, leg extension, leg curl, calf raise",
            "1–1,5 dakika"
          ],
          [
            "Biceps + triceps süperseti",
            "İki hareket arasında bekleme yok, tur bitince 1–1,5 dakika"
          ],
          [
            "Yerde crunch",
            "1 dakika"
          ]
        ]
      },
      "lines": [
        "Telefonun kronometresini kullan. Dinlenmeyi kısaltmak antrenmanı daha etkili yapmaz; sonraki setteki tekrar sayını düşürür."
      ]
    },
    {
      "title": "Tekrarı nasıl yapacaksın",
      "lines": [
        "Kaldırırken: Kararlı ve akıcı, yaklaşık 1 saniye. Savurma yok.",
        "İndirirken: Kontrollü, 2–3 saniye. Ağırlığı bırakıp düşürme.",
        "Hareket genişliği: Her tekrarda makinenin izin verdiği tam genişlik. Kasın gerildiği noktayı atlama; araştırmada tam hareket, yarım harekete göre en azından eşit ya da biraz daha iyi sonuç veriyor.",
        "Sektirme yok: Ağırlık plakaları altta birbirine çarpmamalı, alt noktada zıplatıp hız almamalısın.",
        "Nefes: Kaldırırken ver, indirirken al. Nefesini tutup yüzünü kızartma.",
        "Odak: Kol ve omuz hareketlerinde çalışan kası hissetmeye odaklanmak faydalı olabilir. Bir çalışmada kasa odaklanan grubun biceps'i %12,4, odaklanmayan grubun %6,9 büyüdü (Schoenfeld 2018; bu sayılar ikincil bir kaynaktan).",
        "Sayılan tekrar: Sadece doğru formla yapılan tekrar sayılır. Gövdeyi sallayarak çıkarılan tekrarı deftere yazma."
      ]
    },
    {
      "title": "Isınma",
      "lines": [
        "Genel ısınma gerekmiyor. Salona yürüyerek geldiğin için vücudun zaten ısınmış oluyor.",
        "İlk harekette 2 ısınma seti: Önce çalışma kilonun yarısıyla 8–10 tekrar, 1 dakika dinlenme, sonra yaklaşık dörtte üçüyle 3–5 tekrar. İkisi de kolay olmalı; amaç yorulmak değil, hareketi provalamak.",
        "Sonraki hareketlerde: Yeni bir bölgeye geçerken (örneğin itişten çekişe, bacaktan omuza) çalışma kilonun yarısıyla 6–8 tekrarlık tek bir set yap. Aynı kas zaten çalıştıysa ısınma setine gerek yok.",
        "Esnetme: Antrenman öncesi bir kası 60 saniyeden uzun statik esnetme; kuvveti bir miktar düşürüyor (Warneke ve Lohmann 2024)."
      ]
    },
    {
      "title": "Süperset nasıl yapılır",
      "lines": [
        "Biceps hareketinin 1. setini yap.",
        "Beklemeden triceps hareketine geç ve 1. setini yap.",
        "1–1,5 dakika dinlen.",
        "Aynı turu set sayısı kadar tekrarla.",
        "İki aleti aynı anda tutamayacak kadar kalabalıksa: önce biceps'in tüm setlerini 1–1,5 dakika dinlenmeyle bitir, sonra triceps'e geç. Seans yaklaşık 5 dakika uzar, sonuç değişmez."
      ]
    },
    {
      "title": "Her seansta kaydet",
      "lines": [
        "Her hareket için kiloyu ve her setteki tekrar sayısını yaz. İlerleme kuralı bu kayıtlara dayanıyor; kayıt yoksa geçen hafta ne yaptığını bilemezsin."
      ]
    }
  ],
};
