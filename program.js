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
   Hareket alanları: perHand = ağırlık kol başına girilir; perSide = tekrar her kol için; perLeg = tekrar her bacak için;
   bigStep = "büyük ağırlık adımı" varsayılan olarak açık.
   warmup.plan: ısınma setleri (pct = çalışma kilosunun yüzdesi, bar = boş bar, light = çok hafif). Kaydedilmez.
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
    plate: { unit: 'kg', step: 2.5 },     // plaka takılan aletler (leg press, Smith): her yana 1,25 kg
    dumbbell: { unit: 'kg', step: 2.5 },
    bodyweight: null,
  },

  effortLabels: { rir12: '1–2 kala', rir2: '2 kala', fail: 'tükeniş', deload: '3 kala' },

  sessions: {
    UA: {
      "name": "Üst A",
      "about": "Göğüs, sırt, kol ve omuz. 20 çalışma seti. Hareketleri yazılı sırayla yap.",
      "slots": [
        {
          "key": "ua1d",
          "ex": "dbbench",
          "sets": 3,
          "reps": [
            6,
            10
          ],
          "effort": "rir12",
          "rest": 120,
          "warmup": {
            "plan": [
              {
                "pct": 50,
                "reps": "8–10"
              },
              {
                "pct": 75,
                "reps": "3–5"
              }
            ],
            "sets": true,
            "text": "Seansın ilk hareketi: çalışma kilonun yaklaşık yarısıyla 8–10 tekrar, sonra dörtte üçüyle 3–5 tekrar."
          },
          "effortNote": "Tükenişe gitme; dumbbell'lar yüzünün üzerinde."
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
          "rest": 90,
          "warmup": {
            "plan": [
              {
                "pct": 50,
                "reps": "6–8"
              }
            ],
            "text": "İtişten çekişe geçtiğin için yarı kiloyla 6–8 tekrarlık tek set."
          }
        },
        {
          "key": "ua3",
          "ex": "seatedrow",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "rir12",
          "rest": 90
        },
        {
          "key": "ua6a",
          "ex": "inclinecurl",
          "sets": 2,
          "reps": [
            8,
            12
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "ua7p",
          "ex": "pecdeck",
          "sets": 2,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "ua5",
          "ex": "revpecdeck",
          "sets": 3,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "ua8c",
          "ex": "cablelateral",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "restNote": "İki kolu arka arkaya yap, sonra 1 dakika dinlen."
        },
        {
          "key": "ua6b",
          "ex": "ohext",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        }
      ]
    },
    LA: {
      "name": "Alt A",
      "about": "Bacak, yan omuz, kol ve karın. 20 çalışma seti. Hareketleri yazılı sırayla yap.",
      "slots": [
        {
          "key": "la0b",
          "ex": "bulgarian",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "rir12",
          "rest": 120,
          "restNote": "İki bacağı arka arkaya yap, sonra 2 dakika dinlen.",
          "note": "İlk seanslarda ağırlıksız, gerekirse bir yere tutunarak. Ağırlıksız yaptığın sette kiloya 0 yaz.",
          "effortNote": "Tükenişe gitme."
        },
        {
          "key": "la2",
          "ex": "legcurl",
          "sets": 4,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "ss": "la2",
          "ssPos": 1,
          "note": "İkisi aynı makinede. Sıra: curl, extension, curl, extension, curl, extension, curl."
        },
        {
          "key": "la2e",
          "ex": "legext",
          "sets": 3,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "ss": "la2",
          "ssPos": 2
        },
        {
          "key": "la3d",
          "ex": "dblateral",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "warmup": {
            "plan": [
              {
                "light": true,
                "reps": "8–10"
              }
            ],
            "text": "Bacaktan omuza geçtiğin için çok hafif kiloyla 8–10 tekrarlık tek set."
          }
        },
        {
          "key": "la5s",
          "ex": "sapreacher",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "lastFail",
          "rest": 30,
          "restNote": "Kollar sırayla: sol, sağ, sol, sağ. Kol değiştirirken 20–30 saniye, ayrıca bekleme yok."
        },
        {
          "key": "la5b",
          "ex": "pushdown",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "la7k",
          "ex": "kneeraise",
          "sets": 3,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        }
      ]
    },
    UB: {
      "name": "Üst B",
      "about": "Üst A'nın karşılığı: göğüste eğimli press, sırtta row öne geçiyor, biceps'te hammer curl. 20 çalışma seti. Hareketleri yazılı sırayla yap.",
      "slots": [
        {
          "key": "ub1d",
          "ex": "inclinedbpress",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "rir12",
          "rest": 120,
          "warmup": {
            "plan": [
              {
                "pct": 50,
                "reps": "8–10"
              },
              {
                "pct": 75,
                "reps": "3–5"
              }
            ],
            "sets": true,
            "text": "Seansın ilk hareketi: çalışma kilonun yaklaşık yarısıyla 8–10 tekrar, sonra dörtte üçüyle 3–5 tekrar."
          },
          "effortNote": "Tükenişe gitme.",
          "note": "Sehpa yaklaşık 30 derece."
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
          "rest": 90,
          "warmup": {
            "plan": [
              {
                "pct": 50,
                "reps": "6–8"
              }
            ],
            "text": "İtişten çekişe geçtiğin için yarı kiloyla 6–8 tekrarlık tek set."
          },
          "note": "Bu seansta çekişlerin ilki olduğu için Üst A'ya göre biraz daha ağır ya da daha çok tekrar çıkarabilirsin; bu normal. İki seansın kayıtlarını ayrı tut."
        },
        {
          "key": "ub3",
          "ex": "latpulldown",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "rir12",
          "rest": 90,
          "note": "İstersen bu seansta avuçların birbirine baktığı dar tutamaçla yap; aynı kası biraz farklı açıdan çalıştırır. Hangisini seçersen her Üst B'de onu kullan."
        },
        {
          "key": "ub7h",
          "ex": "hammercurl",
          "sets": 2,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "note": "İki kol aynı anda."
        },
        {
          "key": "ub8p",
          "ex": "pecdeck",
          "sets": 2,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "ub5",
          "ex": "revpecdeck",
          "sets": 3,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "ub4",
          "ex": "cablelateral",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "restNote": "İki kolu arka arkaya yap, sonra 1 dakika dinlen."
        },
        {
          "key": "ub9o",
          "ex": "ohext",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        }
      ]
    },
    LB: {
      "name": "Alt B",
      "about": "Alt A'nın karşılığı: ön bacakta Bulgarian split squat yerine leg press, karında decline bench sit-up. 20 çalışma seti. Hareketleri yazılı sırayla yap.",
      "slots": [
        {
          "key": "lb2p",
          "ex": "legpress",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "rir12",
          "rest": 120,
          "warmup": {
            "plan": [
              {
                "pct": 50,
                "reps": "8–10"
              },
              {
                "pct": 75,
                "reps": "3–5"
              }
            ],
            "sets": true,
            "text": "Seansın ilk hareketi: çalışma kilonun yaklaşık yarısıyla 8–10 tekrar, sonra dörtte üçüyle 3–5 tekrar."
          },
          "effortNote": "Tükenişe gitme.",
          "note": "Ayaklar platformun üst kısmında, derin iniş."
        },
        {
          "key": "lb2",
          "ex": "legcurl",
          "sets": 4,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "ss": "lb2",
          "ssPos": 1,
          "note": "İkisi aynı makinede. Sıra: curl, extension, curl, extension, curl, extension, curl."
        },
        {
          "key": "lb1",
          "ex": "legext",
          "sets": 3,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "ss": "lb2",
          "ssPos": 2
        },
        {
          "key": "lb4",
          "ex": "dblateral",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60,
          "warmup": {
            "plan": [
              {
                "light": true,
                "reps": "8–10"
              }
            ],
            "text": "Bacaktan omuza geçtiğin için çok hafif kiloyla 8–10 tekrarlık tek set."
          }
        },
        {
          "key": "lb6s",
          "ex": "sapreacher",
          "sets": 3,
          "reps": [
            8,
            12
          ],
          "effort": "lastFail",
          "rest": 30,
          "restNote": "Kollar sırayla: sol, sağ, sol, sağ. Kol değiştirirken 20–30 saniye, ayrıca bekleme yok."
        },
        {
          "key": "lb7t",
          "ex": "pushdown",
          "sets": 2,
          "reps": [
            12,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        },
        {
          "key": "lb8s",
          "ex": "situp",
          "sets": 3,
          "reps": [
            10,
            15
          ],
          "effort": "lastFail",
          "rest": 60
        }
      ]
    },
  },

  exercises: {
  "dbbench": {
    "name": "Dumbbell bench press",
    "muscle": "Göğüs",
    "load": "dumbbell",
    "perHand": true,
    "bigStep": true,
    "sub": "Smith makinesinde düz sehpada press ya da plakalı göğüs makinesi",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Göğsün tamamını ağır yükle çalıştıran ana itiş. Seansın ilk ve en ağır hareketi olduğu için 6–10 tekrar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçlar ayaklara doğru bakar, bilek düz, dumbbell ön kolun tam üstünde. İki kol aynı anda.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Kürek kemikleri geride ve sehpaya baskılı. 2–3 saniyede göğsün yanına indir, dirsekler gövdeye 45–60 derece. Sektirmeden it.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Dirsekleri tam yana açmak, yarım inmek, kalçayı sehpadan kaldırmak.",
        "steps": []
      }
    ],
    "yt": "dumbbell bench press form"
  },
  "inclinedbpress": {
    "name": "Incline dumbbell press",
    "muscle": "Göğüs",
    "load": "dumbbell",
    "perHand": true,
    "bigStep": true,
    "sub": "Smith makinesinde eğimli sehpada press",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Eğimli sehpa yükü üst göğse kaydırır. 8–12 tekrar, çünkü dar aralıkta dumbbell'ın kilo adımı ilerlemeyi tıkar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçlar ayaklara doğru bakar, bilek düz. İki kol aynı anda.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Sehpa yaklaşık 30 derece. Üst göğsün iki yanına indir, dik yukarı it.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Sehpayı fazla dik ayarlamak (iş ön omza kayar), beli aşırı çukurlaştırmak.",
        "steps": []
      }
    ],
    "yt": "incline dumbbell press form"
  },
  "smithbench": {
    "name": "Smith machine bench press",
    "retired": true,
    "muscle": "Göğüs",
    "load": "plate",
    "sub": "Düz sehpada dumbbell press ya da plakalı göğüs makinesi",
    "form": [
      {
        "label": "Çalışan kaslar",
        "text": "Göğüs (ana), ön omuz ve triceps (yardımcı)",
        "steps": []
      },
      {
        "label": "",
        "text": "Bu hareket, salondaki plakalı göğüs makinesinin yerine kondu. Kas büyümesi açısından aralarında fark beklenmiyor.",
        "steps": []
      },
      {
        "label": "Smith makinesi nedir",
        "text": "Barın iki yandaki raylara bağlı olduğu, sadece yukarı aşağı hareket ettiği alet. Barı bileğinle çevirince kancalar raydaki dişlere takılır ya da çıkar. Dengeyi makine sağladığı için serbest bardan kolaydır.",
        "steps": []
      },
      {
        "label": "Kurulum",
        "text": "",
        "steps": [
          "Düz bir sehpayı Smith makinesinin ortasına yerleştir.",
          "Sehpaya yat ve boş barı indir. Bar göğsünün ortasına, meme hizasına inmeli. Boyna ya da karna doğru iniyorsa sehpayı ileri geri kaydır.",
          "Makinenin emniyet durdurucuları varsa, barın göğsüne değdiği noktanın hemen altına ayarla. Kaldıramadığın bir tekrarda bar orada durur.",
          "Barı omuz genişliğinden bir karış geniş tut. Bar alttayken ön kolların yere dik olmalı."
        ]
      },
      {
        "label": "Yapılış",
        "text": "",
        "steps": [
          "Kürek kemiklerini geriye ve aşağıya çekip sehpaya bastır, göğsünü yukarı çıkar. Ayaklar yerde sağlam, kalça sehpada.",
          "Barı yukarı itip bileğinle çevirerek kancadan kurtar.",
          "2–3 saniyede göğsünün ortasına indir. Bar göğse hafifçe değsin ya da 1–2 santim üstünde dursun.",
          "Sektirmeden yukarı it. Dirsekler tam kilitlenmeden dur.",
          "Son tekrardan sonra barı üstte bileğinle çevirip kancaya tak. Takıldığından emin olmadan ellerini bırakma."
        ]
      },
      {
        "label": "Sık hatalar",
        "text": "Dirsekleri tam yana açmak (gövdeye göre 45–60 derece olmalı), omuzları kulağa doğru kaldırmak, kalçayı sehpadan kaldırmak, barı göğüste sektirmek, hareketi yarım yapmak.",
        "steps": []
      },
      {
        "label": "İlk seans için",
        "text": "Boş barla başla ve kiloyu set set artır. Boş Smith barının ağırlığı makineye göre değişir; defterine sadece taktığın plakaları yaz ve hep aynı makineyi kullan.",
        "steps": []
      }
    ]
  },
  "chestpress": {
    "name": "Chest press makinesi",
    "retired": true,
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
    "name": "Smith machine incline bench press",
    "retired": true,
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
        "label": "Neden bu hareket",
        "text": "Sırta genişlik veren dikey çekiş.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Üstten tutuş (avuçlar karşıya bakar), eller omuzdan biraz geniş.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Gövde hafif geride ve sabit. Dirsekleri kalçaya doğru çekerek çubuğu üst göğse indir. Yukarıda kollar tam uzasın.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Gövdeyi savurmak, çubuğu enseye indirmek.",
        "steps": []
      }
    ],
    "yt": "lat pulldown form"
  },
  "seatedrow": {
    "name": "Seated row",
    "muscle": "Sırt",
    "load": "machine",
    "sub": "Diğer row makinesi ya da kablo row",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Sırta kalınlık veren yatay çekiş; orta sırtı tamamlar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçların birbirine baktığı dar tutamaç. Dirsekler gövdeye yakın.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Önce kürek kemiklerini geriye çek, sonra dirsekleri. Tutamaç karnın üstüne gelince 1 saniye sık. Gövde dik ve sabit.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Belden sallanmak, omuzları kulağa kaldırmak.",
        "steps": []
      }
    ],
    "yt": "seated cable row form"
  },
  "dblateral": {
    "name": "Dumbbell lateral raise",
    "muscle": "Yan omuz",
    "load": "dumbbell",
    "bigStep": true,
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Yan omuz; kurulumu yok, iki kol aynı anda, bacak gününde hızlıca biter.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçlar gövdeye bakarak başlar, yukarıda yere bakar. Dumbbell'ı sıkma.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Dirsekler hafif bükülü ve sabit. Omuz hizasına kadar kaldır, 2–3 saniyede indir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Belden yaylanmak, omuz hizasının üstüne çıkmak.",
        "steps": []
      }
    ],
    "yt": "dumbbell lateral raise form"
  },
  "cablelateral": {
    "name": "Cable lateral raise",
    "bigStep": true,
    "muscle": "Yan omuz",
    "load": "machine",
    "perSide": true,
    "sub": "Dumbbell lateral raise",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Yan omuz; kabloda kol aşağıdayken de yük var. Üst günlerinde kablo, alt günlerinde dumbbell.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Tek sap, avuç yere bakar, bilek düz.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Makineye yan dur, kablo vücudun önünden geçsin. Kolu omuz hizasına kadar kaldır, dirseği kaldırdığını düşün. Bir kol bitince diğeri.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Gövdeyi yana yatırıp savurmak, omzu kulağa silkmek.",
        "steps": []
      }
    ],
    "yt": "single arm cable lateral raise form"
  },
  "revpecdeck": {
    "name": "Reverse pec deck",
    "muscle": "Arka omuz",
    "load": "machine",
    "sub": "Göğsün eğimli sehpaya dayalıyken dumbbell ile reverse fly",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Arka omzun en pratik hareketi; makine gövdeyi sabitler.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Dikey tutamaç varsa avuçlar birbirine bakar. Gevşek tut.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Göğüs yastıkta. Kolları geniş bir yayla yana ve geriye aç, gövde hizasında dur, yavaşça geri getir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Kürek kemiklerini sıkıca birbirine çekmek (iş orta sırta kayar).",
        "steps": []
      }
    ],
    "yt": "reverse pec deck fly form"
  },
  "inclinecurl": {
    "name": "Incline dumbbell curl",
    "muscle": "Biceps",
    "load": "dumbbell",
    "bigStep": true,
    "sub": "Alçak makaradan kablo curl",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Biceps'i gergin pozisyonda çalıştırır. Sırt hareketlerinden hemen sonra yapılır.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçlar karşıya bakar ve dönmez. İki kol aynı anda. Sol kol daha zayıf olduğu için sol kol bitince seti bitir; sağla fazladan tekrar yapma.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Sehpa 45–60 derece, sırt ve baş yaslı, kollar aşağı sarkık. Dirsekler sabit, altta kol tam açılsın.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Dirsekleri öne taşımak, omuzları sehpadan kaldırmak.",
        "steps": []
      }
    ],
    "yt": "incline dumbbell curl form"
  },
  "sapreacher": {
    "name": "Single-arm dumbbell preacher curl",
    "muscle": "Biceps",
    "load": "dumbbell",
    "perSide": true,
    "bigStep": true,
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Haftanın ana biceps hareketi. Tek kol yapılıyor, çünkü sol kol daha zayıf; her kol kendi yükünü taşıyor.",
        "steps": []
      },
      {
        "label": "Sol kol kuralı",
        "text": "Her sete sol kolla başla. Sol kaç tekrar çıkardıysa sağ kol aynı kiloyla aynı sayıda yapar, fazlasını değil. Son sette sol kol tükenişe gider, sağ aynı sayıda durur.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuç yukarı bakar (alttan tutuş), bilek düz. Boştaki el sehpayı tutar.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Koltuk altı yastığın üst kenarında, üst kol tamamen yaslı. Dumbbell'ı omuza doğru kıvır, yavaş in, altta sektirme.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Altta ağırlığı hızla bırakmak, dirseği yastıktan kaldırmak.",
        "steps": []
      },
      {
        "label": "Kilo",
        "text": "Sol kol ilk sette 14 tekrara ulaşmadan bir üst dumbbell'a geçme. Kiloyu hep sol kol belirler.",
        "steps": []
      }
    ],
    "yt": "single arm dumbbell preacher curl form"
  },
  "preacher": {
    "name": "Preacher curl",
    "retired": true,
    "muscle": "Biceps",
    "load": "dumbbell",
    "sub": "Incline dumbbell curl ya da kablo curl",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Haftanın ana biceps hareketi; kol sabit olduğu için hile yapılamaz, EZ bar'da kilo küçük adımlarla artar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "EZ bar, alttan tutuş. Kıvrımların dışa eğimli kısmından, eller omuz genişliğinde.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Koltuk altları yastığın üst kenarında, üst kol tamamen yaslı. Yavaş in, altta sektirme.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Altta ağırlığı hızla bırakmak, dirsekleri yastıktan kaldırmak.",
        "steps": []
      }
    ],
    "yt": "ez bar preacher curl form"
  },
  "ohext": {
    "name": "Overhead cable triceps extension",
    "muscle": "Triceps",
    "load": "machine",
    "sub": "Otururken tek dumbbell'ı iki elle tutup baş üstü extension",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Triceps'in uzun başını gergin pozisyonda çalıştırır.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "İp, avuçlar birbirine bakar, topuzların hemen altından.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Sırtın makineye dönük, bir ayak önde. Dirsekler başın yanında sabit; kolları tam aç, eller enseye dönene kadar yavaşça geri getir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Dirsekleri yana açmak, üst kolu oynatmak. Hafif kiloyla başla.",
        "steps": []
      }
    ],
    "yt": "overhead rope triceps extension form"
  },
  "pushdown": {
    "name": "Triceps pushdown",
    "muscle": "Triceps",
    "load": "machine",
    "sub": "Baş üstü triceps extension",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Triceps'in yan ve iç başları; overhead hareketi tamamlar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "İple avuçlar birbirine bakar; düz çubukla avuçlar yere bakar.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Dirsekler gövdenin yanında sabit. Kollar tam düzleşene kadar it, yavaş bırak.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Dirsekleri oynatmak, vücut ağırlığıyla bastırmak.",
        "steps": []
      }
    ],
    "yt": "rope triceps pushdown form"
  },
  "legpress": {
    "name": "Leg press",
    "muscle": "Ön bacak",
    "load": "plate",
    "sub": "Hack squat makinesi",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Ağır yüklenebilen, denge gerektirmeyen bacak ve kalça hareketi.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Yan tutamaçlar. Elleri dizlere koyma.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Ayaklar platformun ortasının biraz üstünde. Kalça yastıktan kalkmadan inebildiğin kadar derin in. Üstte dizi kilitleme.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Çok ağır kiloyla birkaç santim inmek, dizleri içe çökertmek.",
        "steps": []
      }
    ],
    "yt": "leg press form"
  },
  "legext": {
    "name": "Leg extension",
    "muscle": "Ön bacak",
    "load": "machine",
    "noSub": true,
    "sub": "Yedeği yok; seansın sonuna bırak",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Uyluğun ön-orta kasını (rectus femoris) leg press büyütmüyor, bu hareket büyütüyor.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Yan tutamaçlar, kalça koltuğa baskılı.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Bacakları tam düzleştir, 1 saniye sık, 2–3 saniyede indir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Savurarak kaldırmak, üstte tam açmamak.",
        "steps": []
      }
    ],
    "yt": "leg extension form"
  },
  "legcurl": {
    "name": "Seated leg curl",
    "muscle": "Arka bacak",
    "load": "machine",
    "sub": "Yatarak leg curl",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Arka bacağın programdaki tek hareketi.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Yan tutamaçlar, kalça koltuğa baskılı.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Üst yastık uyluklara sıkı. Topukları geriye çek, 1 saniye sık, yavaşça uzat.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Kalçayı kaldırmak, ağırlığı düşürerek bırakmak.",
        "steps": []
      }
    ],
    "yt": "seated leg curl form"
  },
  "calf": {
    "name": "Calf raise",
    "muscle": "Baldır",
    "load": "machine",
    "retired": true,
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
  "pecdeck": {
    "name": "Pec deck fly",
    "muscle": "Göğüs",
    "load": "machine",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Göğsü kollar yorulmadan çalıştırır; press'i 5 set yapmak yerine 3 press + 2 fly.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Dikey tutamaçlar, avuçlar öne bakar. Dirsekler hafif bükülü ve sabit.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Sırt yastıkta. Kolları geniş bir yayla önde birleştir, 1 saniye sık, göğüste gerilme hissedene kadar yavaşça aç.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Omuzları öne yuvarlamak, dirsekleri büküp press'e çevirmek.",
        "steps": []
      }
    ],
    "yt": "pec deck fly form"
  },
  "bulgarian": {
    "name": "Bulgarian split squat",
    "muscle": "Ön bacak",
    "load": "dumbbell",
    "perLeg": true,
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Kalçayı gergin pozisyonda çalıştıran ana hareket; ön bacağı da çalıştırır.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "İlk seanslar ağırlıksız, gerekirse bir elle tutun. Sonra iki elde dumbbell, kollar yanda.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Arka ayağın üstü sehpada. Ağırlık öndeki ayakta. Dümdüz aşağı in, öndeki topukla it. Bir bacak bitince diğeri.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Öndeki ayağı sehpaya çok yakın koymak, arkadaki bacakla itmek.",
        "steps": []
      }
    ],
    "yt": "bulgarian split squat form"
  },
  "hammercurl": {
    "name": "Hammer curl",
    "muscle": "Biceps",
    "load": "dumbbell",
    "bigStep": true,
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Biceps'in altındaki brakiyalis ve ön kol başka yerde çalışmıyor; kola kalınlık katar.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Avuçlar birbirine bakar ve dönmez. İki kol aynı anda.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Ayakta, dirsekler gövdenin yanında sabit. Omuza doğru kaldır, yavaş indir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Gövdeyi geriye yatırıp sallanmak, bileği döndürmek.",
        "steps": []
      }
    ],
    "yt": "dumbbell hammer curl form"
  },
  "kneeraise": {
    "name": "Captain's chair knee raise",
    "muscle": "Karın",
    "load": "bodyweight",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Karın; kollar yastığa dayandığı için eller yük taşımaz.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Ön kollar yastıklarda, sırt arka yastıkta. Omuzları çökertme.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "Dizleri kalça hizasının biraz üstüne çek, sonda leğeni hafifçe yukarı kıvır, yavaş indir.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Bacakları savurmak. Yapamazsan yerine yerde Crunch 3×15–20.",
        "steps": []
      }
    ],
    "yt": "captain's chair knee raise form"
  },
  "situp": {
    "name": "Decline bench sit-up",
    "muscle": "Karın",
    "load": "bodyweight",
    "sub": "Salonda sehpa yoksa: yerde Crunch, 3 set 15–20 tekrar",
    "form": [
      {
        "label": "Neden bu hareket",
        "text": "Karın; zorluğu sehpa eğimi ve plakayla artırılabilir.",
        "steps": []
      },
      {
        "label": "Tutuş",
        "text": "Eller göğüste çapraz. Elleri ensede kenetleme.",
        "steps": []
      },
      {
        "label": "Form",
        "text": "En düşük eğimle başla. Omurgayı yuvarlayarak kalk, yukarıda 1 saniye sık, kontrollü in.",
        "steps": []
      },
      {
        "label": "Sık hata",
        "text": "Savrularak kalkmak, inişte kendini bırakmak. Sehpa yoksa yerine yerde Crunch 3×15–20.",
        "steps": []
      }
    ],
    "yt": "decline sit up form"
  },
  "crunch": {
    "name": "Crunch",
    "retired": true,
    "muscle": "Karın",
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

  /* Programdan çıkarılmış hareket yuvaları: yeni seanslarda yer almaz; eski kayıtları geçmişte,
     düzenlemede ve ilerleme listesinde ayrı hareket olarak görünmeye devam eder. */
  retiredSlots: {
    UA: [{"key":"ua1","ex":"chestpress","sets":4,"reps":[6,10],"effort":"rir12","rest":150},{"key":"ua1s","ex":"smithbench","sets":4,"reps":[6,10],"effort":"rir12","rest":150},{"key":"ua4","ex":"dblateral","sets":3,"reps":[10,15],"effort":"lastFail","rest":90}],
    LA: [{"key":"la3","ex":"calf","sets":3,"reps":[8,12],"effort":"lastFail","rest":75},{"key":"la1","ex":"legpress","sets":4,"reps":[8,12],"effort":"rir2","rest":150},{"key":"la4","ex":"cablelateral","sets":3,"reps":[12,15],"effort":"lastFail","rest":90},{"key":"la6","ex":"crunch","sets":3,"reps":[15,20],"effort":"rir12","rest":60,"optional":true},{"key":"la5a","ex":"preacher","sets":3,"reps":[8,12],"effort":"lastFail","rest":60}],
    UB: [{"key":"ub1","ex":"smithincline","sets":4,"reps":[8,12],"effort":"rir12","rest":150},{"key":"ub6a","ex":"preacher","sets":3,"reps":[8,12],"effort":"lastFail","rest":90},{"key":"ub6b","ex":"pushdown","sets":3,"reps":[10,15],"effort":"lastFail","rest":90}],
    LB: [{"key":"lb3","ex":"calf","sets":3,"reps":[8,12],"effort":"lastFail","rest":75},{"key":"lb5a","ex":"inclinecurl","sets":2,"reps":[8,12],"effort":"lastFail","rest":90},{"key":"lb5b","ex":"ohext","sets":2,"reps":[8,12],"effort":"lastFail","rest":90},{"key":"lb6","ex":"crunch","sets":3,"reps":[15,20],"effort":"rir12","rest":60,"optional":true},{"key":"lb6p","ex":"preacher","sets":3,"reps":[8,12],"effort":"lastFail","rest":60}],
  },

  /* Yük azaltma (deload): kilolar aynı, set sayısı yarıya (yukarı yuvarlanır: 4→2, 3→2, 2→1), her set 3 tekrar kala. */
  deload: {
    when: [
      "Deload takvime göre değil, ihtiyaca göre yapılır. Kalori açığında bu ihtiyaç muhtemelen 6–10 haftada bir ortaya çıkar.",
      "Ne zaman: Aşağıdakilerden ikisi aynı anda görülürse.",
      "İki seans üst üste, birkaç harekette birden tekrar sayıların düşüyor.",
      "Eklemlerinde (omuz, dirsek, diz) geçmeyen bir sızı var.",
      "Uykun bozuldu ya da sürekli yorgun hissediyorsun.",
      "Salona gitme isteğin belirgin azaldı."
    ],
    how: [
      "Hareketler ve kilolar aynı kalır.",
      "Her hareketin set sayısı yarıya iner (4 set 2 olur, 3 set 2 olur, 2 set 1 olur).",
      "Hiçbir sette tükenişe gidilmez; her set RIR 3 civarında biter.",
      "Sonraki hafta normal programa, bıraktığın kilolarla dönersin."
    ],
  },

  /* Uzun ara: son seanstan bu kadar gün sonra not gösterilir */
  longBreak: { days: 14, text: "2–3 hafta ara verdin: İlk hafta kiloları yaklaşık yüzde 10 düşür, tükenişe gitme. İkinci hafta eski kilolarına dön." },

  /* Hiç kaydı olmayan hareket için not */
  firstTime: "İlk hafta: hafif başla, 1–2 tekrar kalana kadar kiloyu artır.",

  /* "Büyük ağırlık adımı" açık hareketlerde artırma önerisi, üst sınırın bu kadar tekrar üstünde verilir */
  bigStep: { extraReps: 2, text: "Kilo adımı büyük olan hareketlerde (dumbbell curl'ler, lateral raise'ler, dumbbell press'ler) bir sonraki kilo yüzde 20–30 artış demek olabilir. O zaman kiloyu artırmadan önce ilk sette üst sınırı 2 tekrar geç (örneğin 12–15 yerine 17'ye çık), sonra artır. Bazı salonlarda makine plakalarının arasına takılan 1–2,5 kg'lık ek ağırlıklar olur; varsa onları kullan." },

  /* Aynı seans türünde bu kadar seans üst üste artış yoksa "kiloyu koru" notu (uyarı değil) */
  hold: { sessions: 3, short: "Kiloyu koru", text: "Bu harekette 3 seans üst üste artış yok: kiloyu koru ve zorlamayı artırma. Tek seansa değil 3–4 haftalık gidişe bak; kalori açığında kiloları korumak başarıdır." },

  /* Ayda bir tahmin kontrolü hatırlatması (zorlayıcı değil, kapatılabilir) */
  estCheck: {
    everyDays: 30,
    text: "Lat pulldown ve seated row'da son seti tükenişe götürüp tahminini kontrol et.",
    more: "Büyük hareketlerde hiç tükenişe gitmediğin için \"1–2 tekrar kaldı\" tahminin sınanmıyor. Leg press'te bunu ancak emniyet kolları ayarlıyken yap. Dumbbell press'lerde yapma.",
  },

  /* Haftalık set bütçesi (doğrudan setler, hafta toplamı) */
  weeklyTargets: {
  "Göğüs": 10,
  "Sırt": 12,
  "Biceps": 10,
  "Triceps": 8,
  "Yan omuz": 8,
  "Arka omuz": 6,
  "Ön bacak": 12,
  "Arka bacak": 8,
  "Karın": 6
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
        "Varsayılan: Setler 1–2 tekrar kala biter. Seti bitirdiğinde \"bir iki tane daha çıkardı\" diyebilmelisin. Son tekrarlar belirgin yavaşlamalı; yavaşlamıyorsa set hafif kalmıştır.",
        "\"Son set tükenişe\" yazan hareketlerde yalnızca son set tükenişe kadar gider; önceki setler 1–2 tekrar kala biter. Formu bozmadan.",
        "\"Tükenişe gitmez\" yazanlarda hiçbir set tükenişe gitmez: dumbbell bench press, incline dumbbell press, lat pulldown, seated row, leg press ve Bulgarian split squat.",
        "Tahminini ayarlamak: İnsanlar kalan tekrarı ortalama 1 tekrar hatayla tahmin ediyor; yeni başlayan ve aradan dönenler genelde erken bırakıyor (Biolayne, Halperin ve ark. özeti). İlk hafta tek eklemli hareketlerin son setinde tükenişe gidip sınırını gör.",
        "Ayda bir tahmin kontrolü: Büyük hareketlerde hiç tükenişe gitmediğin için \"1–2 tekrar kaldı\" tahminin oralarda hiç sınanmıyor. 3–4 haftada bir, lat pulldown ve seated row'da son seti tükenişe kadar götür ve tahmininle karşılaştır. Leg press'te bunu ancak emniyet kolları ayarlıyken yap. Dumbbell press'lerde yapma. Ek kontrol: aynı kiloyla son setin tekrarı ilk setle aynı çıkıyorsa ilk setler büyük olasılıkla fazla hafif bitmiştir."
      ]
    },
    {
      "title": "Setler arasında dinlenme",
      "table": {
        "head": ["Hareket grubu", "Dinlenme"],
        "rows": [
          ["Dumbbell bench press, incline dumbbell press, leg press, Bulgarian split squat", "2 dakika"],
          ["Lat pulldown, seated row", "1,5 dakika"],
          ["Diğer tüm hareketler", "1 dakika"],
          ["Seated leg curl + leg extension süperseti", "Curl'den sonra beklemeden extension, extension'dan sonra 1 dakika"]
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
        "Süperset yalnızca seated leg curl + leg extension çiftinde var; ikisi aynı makinede. Kol hareketleri artık süperset değil; biceps ve triceps hareketleri ayrı ayrı yapılıyor.",
        "Sıra: curl, extension, curl, extension, curl, extension, curl (curl 4 set, extension 3 set).",
        "Curl'den sonra beklemeden extension'a geç; extension'dan sonra 1 dakika dinlen.",
        "İkisinde de son set tükenişe kadar gider."
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
