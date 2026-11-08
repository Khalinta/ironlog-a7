'use strict';

/* =========================================================
   IronLog – sade, çevrimdışı çalışan gym takip uygulaması
   ========================================================= */

const STORAGE_KEY = 'ironlog.v1';   // Anahtar değişmez: eski kayıtlar aynı yerden okunur
const DATA_VERSION = 2;
const APP_VERSION = '3.0.0';
const WARMUP_MIN = 5;
const CARDIO_MIN = 10;
const DELOAD_FACTOR = 0.8;          // "Bu hafta yük azalt": ağırlık hedefi ~%20 düşük
const DELOAD_RIR = '4';
const LONG_BREAK_DAYS = 7;
const WAIST_EVERY_DAYS = 14;
const ADDED_FROM_WEEK = 5;

/* Haftalık plan: ana = günün ilk üç hareketi; yardımcı (kod içinde "small") = reverse pec deck, lateral raise,
   curl, triceps pushdown, hip thrust, dead bug; eklenen = 5. haftadan itibaren başlayan hareketler. */
const WEEKS = {
  1: { main: 2, small: 1, added: 0, rir: '3–4' },
  2: { main: 2, small: 2, added: 0, rir: '3' },
  3: { main: 3, small: 2, added: 0, rir: '2–3' },
  4: { main: 3, small: 2, added: 0, rir: '2' },
  5: { main: 3, small: 2, added: 2, rir: '2' },
  6: { main: 3, small: 2, added: 2, rir: '1–2' },
  7: { main: 3, small: 2, added: 2, rir: '1–2' },
  8: { main: 3, small: 2, added: 2, rir: '1–2' },
};
const KIND_LABEL = { main: 'Ana', small: 'Yardımcı', added: 'Eklenen' };

const PRESS_TIP = 'Tutma yeri göğüs ortası hizasında, omuzları kulaklara kaldırma.';
const EX = {
  legpress: {
    name: 'Leg press', weighted: true, noFailure: true,
    tip: ['Ayaklarını platformda biraz yüksek koy ve belin koltuktan kalkmadan inebildiğin yerde dur.', 'Belin yuvarlanmaya başlamadan dur, dizleri üstte kilitleme.'],
    alt: 'Daha hafif ağırlık ve daha dar hareket aralığı',
  },
  chestpress: {
    name: 'Göğüs press makinesi', weighted: true, noFailure: true,
    tip: ['Kürek kemiklerini geriye yasla ve kollarını tam kilitlemeden it.', PRESS_TIP],
    alt: 'Pec deck makinesi',
  },
  seatedrow: {
    name: 'Oturarak row makinesi', weighted: true,
    tip: ['Gövdeni sallamadan dirseklerini geriye çek.'],
    alt: 'Göğüs destekli row makinesi',
  },
  revpecdeck: {
    name: 'Reverse pec deck (ters kelebek)', weighted: true, lastSetNote: true,
    tip: [],
    alt: 'Göğüs destekli dumbbell ters fly (eğimli sehpaya yüzüstü)',
  },
  lateral: {
    name: 'Dumbbell lateral raise', weighted: true, lastSetNote: true,
    tip: ['Hafif dumbbell seç, dirseklerini omuz hizasına kadar kaldır ve yavaş indir.'],
    alt: 'Lateral raise makinesi',
  },
  preacher: {
    name: 'Tek kol dumbbell preacher curl', weighted: true, perSide: 'her kol', lastSetNote: true,
    tip: ['Kolunu sehpaya yasla, ağırlığı yavaş indir ve en altta dirseğini kilitleme.'],
    alt: 'Oturarak dumbbell curl (sehpa doluysa da bunu yap)',
  },
  legcurl: {
    name: 'Oturarak leg curl', weighted: true,
    tip: ['Kalçanı koltuktan kaldırmadan topuklarını alta çek.'],
    alt: 'Daha hafif ağırlık ve daha dar hareket aralığı',
  },
  latpulldown: {
    name: 'Lat pulldown', weighted: true,
    tip: ['Tutamağı göğsünün üstüne çek, gövdeni geriye savurma.'],
    alt: 'Kablolu düz kol pulldown',
  },
  shoulderpress: {
    name: 'Omuz press makinesi', weighted: true, noFailure: true,
    tip: ['Sırtını pedde tut ve belini kavisleyerek itme.', 'Omuzları kulaklara kaldırma.'],
    alt: 'Daha hafif ağırlık ve daha dar hareket aralığı',
  },
  hipthrust: {
    name: 'Hip thrust makinesi', weighted: true, noFailure: true,
    tip: ['Hareket kalçadan gelsin, üstte beli fazla bükme.'],
    alt: 'Dumbbell ile kalça köprüsü (sırt sehpaya dayalı)',
  },
  deadbug: {
    name: 'Dead bug', weighted: false, perSide: 'her yön',
    tip: ['Belini yere bastırırken karşı kol ve bacağı yavaşça uzat.'],
    alt: 'Sırtüstü dizler bükülü, sırayla ayak dokundurma',
  },
  pushdown: {
    name: 'Triceps pushdown', weighted: true, lastSetNote: true,
    tip: [],
    alt: '',
  },
  // Programdan çıkarıldı; sadece eski kayıtların geçmişte görünmesi için duruyor.
  abduction: { name: 'Hip abduction makinesi', weighted: true, retired: true, tip: [], alt: '' },
};

/* Aktif program. kind: main | small (yardımcı) | added. ss: süperset grubu (aynı gruptaki ikinci hareketten sonra dinlenilir). */
const PROGRAM = {
  A: [
    { id: 'legpress', kind: 'main', reps: [8, 12], rest: 120 },
    { id: 'chestpress', kind: 'main', reps: [8, 12], rest: 90 },
    { id: 'seatedrow', kind: 'main', reps: [8, 12], rest: 90 },
    { id: 'legcurl', kind: 'added', reps: [10, 15], rest: 75 },
    { id: 'revpecdeck', kind: 'small', reps: [12, 20], rest: 60 },
    { id: 'lateral', kind: 'small', reps: [12, 20], rest: 60 },
    { id: 'preacher', kind: 'small', reps: [12, 20], rest: 60 },
  ],
  B: [
    { id: 'legcurl', kind: 'main', reps: [8, 12], rest: 90 },
    { id: 'latpulldown', kind: 'main', reps: [8, 12], rest: 90 },
    { id: 'shoulderpress', kind: 'main', reps: [8, 12], rest: 90 },
    { id: 'hipthrust', kind: 'small', reps: [10, 15], rest: 90 },
    { id: 'legpress', kind: 'added', reps: [10, 15], rest: 120 },
    { id: 'chestpress', kind: 'added', reps: [8, 12], rest: 90 },
    { id: 'deadbug', kind: 'small', reps: [8, 10], rest: 60 },
    { id: 'preacher', kind: 'small', reps: [12, 20], rest: 60, ss: 'kol', ssPos: 1 },
    { id: 'pushdown', kind: 'small', reps: [12, 15], rest: 60, ss: 'kol', ssPos: 2 },
  ],
};

/* Önceki sürümlerin değerleri: eski kayıtlarda tekrar aralığı/dinlenme saklanmadığı için bunlar kullanılır. */
const LEGACY = {
  legpress: { kind: 'main', reps: [10, 12], rest: 90 },
  chestpress: { kind: 'main', reps: [10, 12], rest: 90 },
  seatedrow: { kind: 'main', reps: [10, 12], rest: 90 },
  legcurl: { kind: 'main', reps: [10, 12], rest: 90 },
  latpulldown: { kind: 'main', reps: [10, 12], rest: 90 },
  shoulderpress: { kind: 'main', reps: [10, 12], rest: 90 },
  lateral: { kind: 'small', reps: [12, 15], rest: 60 },
  preacher: { kind: 'small', reps: [12, 15], rest: 60 },
  abduction: { kind: 'small', reps: [12, 15], rest: 60 },
  deadbug: { kind: 'small', reps: [8, 8], rest: 60 },
  revpecdeck: { kind: 'small', reps: [12, 20], rest: 60 },
  hipthrust: { kind: 'small', reps: [10, 15], rest: 90 },
  pushdown: { kind: 'small', reps: [12, 15], rest: 60 },
};

const WARMUP_TIP = 'Başta 5 dk rahat bisiklet veya eliptik.';
const PREP_SET_NOTE = 'Hazırlık seti: Bu hareketten önce çok hafif 1x12. Bu seti kaydetme; kayıtlara ve ağırlık artırma hesabına girmez.';
const PREP_SET_COUNT = 2; // Günün ilk iki hareketi
const CARDIO_TIP = 'Sonda 10 dk orta tempo bisiklet veya eliptik. Süre fazla uzarsa önce kardiyoyu kısalt.';
const SESSION_TARGET_MIN = 60;
const SESSION_NOTE = 'Hedef ~60 dk; 5-10 dk sapma sorun değil. Süre fazla uzarsa önce kardiyoyu kısalt.';
const WALK_NOTE = 'Günlük yürüyüşe devam.';
const RIR_INFO = '"Kalan tekrar", set bitince daha kaç tekrar yapabileceğini gösterir.';
const RIR_CHECK_NOTE = '3-4 haftada bir küçük bir hareketin son setini tükenişe götür, kalan tekrar tahminini kontrol et.';
const ALT_NOTE = 'Keskin/batan ağrı olursa hareketi bırak, alternatifine geç. Kas yorgunluğu normal, eklem ağrısı değil.';
const BREATH_NOTE = 'Nefesini tutup ıkınma, iterken nefes ver.';
const NO_FAILURE_NOTE = 'Tam tükenişe gitme.';
const LAST_SET_NOTE = 'Son set 0-1 tekrar kala bitebilir.';
const LONG_BREAK_NOTE = '7 günden uzun ara verdin. İlk antrenmanda ağırlığı yaklaşık %10 azalt.';
const DELOAD_INFO = 'Sadece gerekirse: Performans iki antrenman üst üste düşerse, eklem rahatsızlığı artarsa veya toparlanamazsan 1 hafta kullan.';
const BUMP_EXTRA = 'Adım çok büyükse (makinelerde 5-7 kg gibi): önce üst sınırı 2 tekrar geç, sonra artır. Varsa 1,25-2,5 kg ek plaka kullan. Yeni ağırlıkta aralığın altına düşmen normal, tekrar üst sınıra çık. Form bozuluyorsa ya da diz/bel ağrıyorsa artırma.';
const AFTER_W8_NOTE = '8. haftadan sonra 6-8. hafta ayarlarıyla devam et (hafta 8 seçili kalabilir).';
const NO_PROGRESS_DAYS = 14;
const NO_PROGRESS_NOTE = 'Son 2 haftada bu ana harekette ilerleme görünmüyor. 2-3 hafta üst üste ilerleme olmazsa programı yeniden değerlendir.';

/* ---------------- Yardımcılar ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null ? '–' : String(Math.round(n * 100) / 100).replace('.', ','));
const rangeText = (reps) => (reps[0] === reps[1] ? String(reps[0]) : `${reps[0]}-${reps[1]}`);
const sameRange = (a, b) => a[0] === b[0] && a[1] === b[1];
const roundHalf = (n) => Math.round(n * 2) / 2;
const fmtRest = (sec) => (sec >= 120 && sec % 60 === 0 ? `${sec / 60} dk` : `${sec} sn`);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DAY_MS = 86400000;

function parseNum(v, int) {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = int ? parseInt(s, 10) : parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 2000) return null;
  return int ? n : Math.round(n * 100) / 100;
}

function fmtDate(iso, withWeekday) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d)) return '';
  const opts = { day: 'numeric', month: 'short' };
  if (withWeekday) opts.weekday = 'short';
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('tr-TR', opts);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Programdaki set sayısı. Yük azaltmada yarıya iner, en az 1 kalır. */
function setsFor(week, kind, deload) {
  const n = WEEKS[week][kind] || 0;
  if (!n) return 0;
  return deload ? Math.max(1, Math.floor(n / 2)) : n;
}

/** O hafta yapılacak hareketler (eklenen hareketler 5. haftadan itibaren). */
function slotsFor(day, week) {
  return PROGRAM[day].filter((sl) => WEEKS[week][sl.kind] > 0);
}

const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------------- Durum (localStorage) ---------------- */

function defaultState() {
  return { version: DATA_VERSION, week: 1, deloadMode: false, deloadSince: null, sessions: [], current: null, timer: null, body: [], waist: [] };
}

function normSet(s) {
  if (!s || typeof s !== 'object') return null;
  return {
    w: parseNum(s.w),
    r: parseNum(s.r, true),
    pr: parseNum(s.pr, true),
    pw: parseNum(s.pw),
    done: !!s.done,
  };
}

function validRange(r) {
  return Array.isArray(r) && r.length === 2 && r.every((x) => Number.isInteger(x) && x > 0 && x < 100) && r[0] <= r[1];
}

function normEntry(e) {
  if (!e || !EX[e.id] || !Array.isArray(e.sets)) return null;
  const legacy = LEGACY[e.id];
  return {
    id: e.id,
    kind: ['main', 'small', 'added'].includes(e.kind) ? e.kind : legacy.kind,
    reps: validRange(e.reps) ? [e.reps[0], e.reps[1]] : legacy.reps.slice(),
    rest: parseNum(e.rest, true) || legacy.rest,
    bump: parseNum(e.bump),
    back: parseNum(e.back),
    ss: typeof e.ss === 'string' ? e.ss.slice(0, 20) : null,
    ssPos: e.ssPos === 1 || e.ssPos === 2 ? e.ssPos : null,
    sets: e.sets.map(normSet).filter(Boolean),
  };
}

function normSession(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.day !== 'A' && s.day !== 'B') return null;
  const week = WEEKS[s.week] ? Number(s.week) : 1;
  return {
    id: typeof s.id === 'string' ? s.id : uid(),
    day: s.day,
    week,
    deload: !!s.deload,
    longBreak: !!s.longBreak,
    startedAt: typeof s.startedAt === 'string' ? s.startedAt : new Date().toISOString(),
    finishedAt: typeof s.finishedAt === 'string' ? s.finishedAt : null,
    warmupDone: !!s.warmupDone,
    cardioDone: !!s.cardioDone,
    cardioMin: parseNum(s.cardioMin, true) || CARDIO_MIN,
    exercises: Array.isArray(s.exercises) ? s.exercises.map(normEntry).filter(Boolean) : [],
  };
}

function normMeasures(list, key, max) {
  if (!Array.isArray(list)) return [];
  const byDate = new Map();
  list.forEach((m) => {
    if (!m || typeof m.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(m.date)) return;
    const v = parseNum(m[key]);
    if (v == null || v <= 0 || v > max) return;
    byDate.set(m.date, { date: m.date, [key]: v });
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz veri');
  if (!Array.isArray(raw.sessions)) throw new Error('Yedekte antrenman listesi yok');
  const st = defaultState();
  st.week = WEEKS[raw.week] ? Number(raw.week) : 1;
  st.deloadMode = !!raw.deloadMode;
  st.deloadSince = st.deloadMode && typeof raw.deloadSince === 'string' ? raw.deloadSince : null;
  st.sessions = raw.sessions.map(normSession).filter((s) => s && s.finishedAt);
  st.sessions.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  st.current = raw.current ? normSession(raw.current) : null;
  if (st.current) st.current.finishedAt = null;
  if (raw.timer && typeof raw.timer === 'object' && Number.isFinite(raw.timer.end)) {
    st.timer = { end: raw.timer.end, total: Number(raw.timer.total) || 60, label: String(raw.timer.label || '') };
  }
  st.body = normMeasures(raw.body, 'kg', 500);
  st.waist = normMeasures(raw.waist, 'cm', 300);
  return st;
}

function load() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return defaultState(); }
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    // Sürüm yükseltmeden önce eski verinin bir kopyasını sakla (bir kez)
    if ((parsed.version || 1) < DATA_VERSION) {
      try { localStorage.setItem(STORAGE_KEY + '.backup-v' + (parsed.version || 1), raw); } catch (_) {}
    }
    return normalize(parsed);
  } catch (e) {
    // Bozuk veri: silmeden kenara al
    try { localStorage.setItem(STORAGE_KEY + '.corrupt.' + Date.now(), raw); } catch (_) {}
    return defaultState();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Kaydedilemedi! Telefon depolaması dolu olabilir.');
  }
}

/* ---------------- Geçmiş sorguları ---------------- */

function nextDayAuto() {
  const last = state.sessions[state.sessions.length - 1];
  return last ? (last.day === 'A' ? 'B' : 'A') : 'A';
}

function doneSets(entry) {
  return entry ? entry.sets.filter((s) => s.done) : [];
}

/** En son yapılan (tamamlanmış set içeren) kayıt; pred(session, entry) ile süzülür. */
function lastEntry(exId, pred = () => true) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    const e = s.exercises.find((x) => x.id === exId);
    if (e && doneSets(e).length && pred(s, e)) return { session: s, entry: e };
  }
  return null;
}

/** Ağırlık önerisi ve artırma hesabı için referans: yük azaltma kayıtları hiç kullanılmaz.
    Önce aynı tekrar aralığındaki son kayıt (ör. A'daki leg press 8-12 ile B'deki 10-15 ayrı tutulur), yoksa aynı hareketin son kaydı. */
function progressRef(exId, reps) {
  return lastEntry(exId, (s, e) => !s.deload && sameRange(e.reps, reps)) || lastEntry(exId, (s) => !s.deload);
}

/** O kaydın bütün setleri (o haftanın set sayısı kadar) tamamlanmış ve hepsi üst sınıra ulaşmış mı? */
function reachedTop(exId, entry, top) {
  if (!EX[exId].weighted || !entry || !entry.sets.length) return false;
  return entry.sets.every((s) => s.done && s.r != null && s.r >= top);
}

/** Son kayıtta alt sınırın altında kalan set varsa, bundan önceki daha düşük ağırlık. */
function previousWeight(exId, reps, ref) {
  if (!EX[exId].weighted) return null;
  const ds = doneSets(ref.entry);
  if (!ds.some((s) => s.r != null && s.r < reps[0])) return null;
  const maxW = Math.max(...ds.map((s) => s.w || 0));
  for (let i = state.sessions.indexOf(ref.session) - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (s.deload) continue;
    const e = s.exercises.find((x) => x.id === exId && sameRange(x.reps, reps));
    if (!e || !doneSets(e).length) continue;
    const w = Math.max(...doneSets(e).map((x) => x.w || 0));
    if (w > 0 && w < maxW) return w;
  }
  return null;
}

/** Ana harekette performans: en yüksek ağırlık, eşitse o ağırlıktaki en iyi tekrar.
    minReps verilirse sadece aralığın alt sınırına ulaşan setler sayılır (yoksa 0). */
function perfOf(entry, minReps = 0) {
  const all = doneSets(entry).filter((s) => s.w != null);
  if (!all.length) return null;
  const ds = all.filter((s) => (s.r || 0) >= minReps);
  if (!ds.length) return { w: 0, r: 0 };
  const w = Math.max(...ds.map((s) => s.w));
  const r = Math.max(...ds.filter((s) => s.w === w).map((s) => s.r || 0));
  return { w, r };
}
const better = (a, b) => a.w > b.w || (a.w === b.w && a.r > b.r);

function strengthHistory(exId, reps) {
  return state.sessions
    .filter((s) => !s.deload)
    .map((s) => ({ s, e: s.exercises.find((x) => x.id === exId && sameRange(x.reps, reps)) }))
    .filter((x) => x.e && perfOf(x.e))
    .map((x) => ({ date: x.s.finishedAt, shown: perfOf(x.e), perf: perfOf(x.e, reps[0]) }));
}

/** 2+ haftadır ilerleme yok mu? (son 14 günde, önceki en iyi performans geçilmediyse) */
function noProgress(hist, now = Date.now()) {
  if (hist.length < 3) return false;
  const cut = now - NO_PROGRESS_DAYS * DAY_MS;
  const before = hist.filter((h) => new Date(h.date).getTime() < cut);
  const within = hist.filter((h) => new Date(h.date).getTime() >= cut);
  if (!before.length || within.length < 2) return false;
  const best = before.reduce((a, h) => (better(h.perf, a) ? h.perf : a), before[0].perf);
  return !within.some((h) => better(h.perf, best));
}

function daysSinceLast(now = Date.now()) {
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return null;
  return (now - new Date(last.finishedAt).getTime()) / DAY_MS;
}

/* ---------------- Antrenman başlatma ---------------- */

function buildSession(day, week, deload) {
  const gap = daysSinceLast();
  const exercises = slotsFor(day, week).map((sl) => {
    const ex = EX[sl.id];
    const [lo, hi] = sl.reps;
    const n = setsFor(week, sl.kind, deload);
    const ref = progressRef(sl.id, sl.reps);
    const refSets = ref ? doneSets(ref.entry) : [];
    const bump = !deload && ref && reachedTop(sl.id, ref.entry, hi)
      ? Math.max(...refSets.map((s) => s.w || 0)) : null;
    // Aralığın alt sınırına bile ulaşılamadıysa önceki (daha düşük) ağırlığa dön
    const back = !deload && bump == null && ref ? previousWeight(sl.id, sl.reps, ref) : null;
    const sets = [];
    for (let j = 0; j < n; j++) {
      const rs = refSets[j] || refSets[refSets.length - 1] || null;
      let w = ex.weighted && rs && rs.w != null ? (back != null ? back : rs.w) : null;
      let pw = null;
      if (deload && w != null) { pw = roundHalf(w * DELOAD_FACTOR); w = null; }
      // Ağırlık artırılacaksa hedef aralığın altı; değilse son tekrar (aralık içinde)
      const pr = bump == null && back == null && rs && rs.r != null ? Math.min(hi, Math.max(lo, rs.r)) : lo;
      sets.push({ w, r: null, pr, pw, done: false });
    }
    return { id: sl.id, kind: sl.kind, reps: [lo, hi], rest: sl.rest, bump, back, ss: sl.ss || null, ssPos: sl.ssPos || null, sets };
  });
  return {
    id: uid(), day, week, deload,
    longBreak: gap != null && gap > LONG_BREAK_DAYS,
    startedAt: new Date().toISOString(), finishedAt: null,
    warmupDone: false, cardioDone: false, cardioMin: CARDIO_MIN,
    exercises,
  };
}

/* ---------------- Arayüz durumu ---------------- */

const ui = {
  tab: 'train',
  dayChoice: null,      // Ana ekranda elle seçilen gün (null = otomatik)
  open: new Set(),      // Açık ipucu/alternatif kutuları
  prevW: null,
};

/* ---------------- Render ---------------- */

function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const app = $('#app');
  if (ui.tab === 'history') app.innerHTML = renderHistory();
  else if (ui.tab === 'track') app.innerHTML = renderTrack();
  else if (ui.tab === 'settings') app.innerHTML = renderSettings();
  else app.innerHTML = state.current ? renderWorkout() : renderHome();
  updateWakeLock();
}

function rirFor(week, deload) {
  return deload ? DELOAD_RIR : WEEKS[week].rir;
}

function setsSummary(week, dl) {
  const w = WEEKS[week];
  const added = w.added ? `Eklenen ${setsFor(week, 'added', dl)}` : 'Eklenen yok';
  return `Ana ${setsFor(week, 'main', dl)} · Yardımcı ${setsFor(week, 'small', dl)} · ${added}`;
}

function renderHome() {
  const auto = nextDayAuto();
  const day = ui.dayChoice || auto;
  const dl = state.deloadMode;
  const last = state.sessions[state.sessions.length - 1];
  const gap = daysSinceLast();
  const active = slotsFor(day, state.week);
  const deloadDays = dl && state.deloadSince ? (Date.now() - new Date(state.deloadSince).getTime()) / DAY_MS : 0;

  const weekBtns = Object.keys(WEEKS).map((k) => `
    <button data-act="week" data-week="${k}" class="${Number(k) === state.week ? 'on' : ''}" aria-label="Hafta ${k}">${k}</button>`).join('');

  const items = PROGRAM[day].map((sl) => {
    const ex = EX[sl.id];
    const n = setsFor(state.week, sl.kind, dl);
    const side = ex.perSide ? ' ' + ex.perSide : '';
    const ss = sl.ss ? `<span class="ss-mark">${sl.ssPos === 1 ? 'Süperset' : '+'}</span>` : '';
    if (!n) return `<li class="off"><span>${esc(ex.name)}</span><span class="meta">${ADDED_FROM_WEEK}. haftadan</span></li>`;
    return `<li class="${sl.ss ? 'ss ss' + sl.ssPos : ''}"><span>${ss}${esc(ex.name)}</span><span class="meta">${n} × ${rangeText(sl.reps)}${side}</span></li>`;
  }).join('');

  return `
    <header class="brand">
      <div class="logo">IRON<span>LOG</span></div>
      <div class="brand-sub">Hafta ${state.week}${dl ? ' · yük azaltma' : ''}</div>
    </header>

    <section class="card hero">
      <div class="eyebrow">Sıradaki antrenman</div>
      <div class="hero-row">
        <div class="hero-day">${day}</div>
        <div class="hero-info">
          <div class="hero-title">${day} günü</div>
          <div class="muted small">${active.length} hareket · ~${SESSION_TARGET_MIN} dk</div>
        </div>
      </div>
      <div class="seg">
        <button data-act="day" data-day="A" class="${day === 'A' ? 'on' : ''}">A günü</button>
        <button data-act="day" data-day="B" class="${day === 'B' ? 'on' : ''}">B günü</button>
      </div>
      <div class="muted small" style="margin-top:12px">
        ${last ? `Son antrenman: ${last.day} günü, ${fmtDate(last.finishedAt, true)}. ` : 'Henüz kayıtlı antrenman yok. '}
        Otomatik sıra: <b>${auto}</b>${ui.dayChoice && ui.dayChoice !== auto ? ' (elle değiştirdin)' : ''}
      </div>
      ${gap != null && gap > LONG_BREAK_DAYS ? `<div class="note warn">${LONG_BREAK_NOTE}</div>` : ''}
    </section>

    <section class="card">
      <div class="row-between"><h2>Hafta</h2>${dl ? '<span class="tag">Yük azaltma açık</span>' : ''}</div>
      <div class="weeks">${weekBtns}</div>
      <div class="stat-row">
        <div class="stat"><b>${setsFor(state.week, 'main', dl)}</b><span>Ana set</span></div>
        <div class="stat"><b>${setsFor(state.week, 'small', dl)}</b><span>Yardımcı</span></div>
        <div class="stat"><b>${WEEKS[state.week].added ? setsFor(state.week, 'added', dl) : '–'}</b><span>Eklenen</span></div>
        <div class="stat accent"><b>${rirFor(state.week, dl)}</b><span>Kalan tekrar</span></div>
      </div>
      <p class="muted small" style="margin:12px 0 0">${esc(RIR_INFO)} ${esc(RIR_CHECK_NOTE)}</p>
      ${state.week === 8 ? `<div class="note blue">${AFTER_W8_NOTE}</div>` : ''}
    </section>

    <section class="card">
      <h2>${day} günü planı</h2>
      <ul class="plan-list">
        <li class="step-li"><span>Isınma</span><span class="meta">${WARMUP_MIN} dk</span></li>
        ${items}
        <li class="step-li"><span>Kardiyo</span><span class="meta">${CARDIO_MIN} dk</span></li>
      </ul>
      <p class="muted small" style="margin:10px 0 0">${esc(SESSION_NOTE)} ${esc(WALK_NOTE)}</p>
    </section>

    <section class="card">
      <div class="row-between">
        <h2>Bu hafta yük azalt</h2>
        <button class="switch ${dl ? 'on' : ''}" data-act="deload" role="switch" aria-checked="${dl}" aria-label="Bu hafta yük azalt"><span></span></button>
      </div>
      <p class="muted small" style="margin:8px 0 0">${esc(DELOAD_INFO)}</p>
      ${dl ? '<div class="note blue">Açık: ağırlık ~%20 az gösterilir, setler yarıya iner (en az 1), 4 tekrar kala bitir. Bu kayıtlar ağırlık artırma önerisini etkilemez. Kapatınca program kaldığı yerden devam eder.</div>' : ''}
      ${deloadDays >= 7 ? '<div class="note warn">1 hafta doldu: toparlandıysan yük azaltmayı kapat.</div>' : ''}
    </section>

    <div class="sticky-cta">
      <button class="btn primary" data-act="start">${day} günü antrenmanına başla</button>
    </div>`;
}

function countSets(cur) {
  let total = 0, done = 0;
  cur.exercises.forEach((e) => e.sets.forEach((s) => { total++; if (s.done) done++; }));
  return { total, done };
}

function elapsedText(cur) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(cur.startedAt).getTime()) / 60000));
  return `${min} dk / hedef ~${SESSION_TARGET_MIN} dk`;
}

function renderWorkout() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  const exHtml = cur.exercises.map((e, i) => renderExercise(cur, e, i)).join('');
  const safeOpen = ui.open.has('safety');
  return `
    <div class="wk-head">
      <div>
        <div class="eyebrow">Hafta ${cur.week}${cur.deload ? ' · yük azaltma' : ''}</div>
        <div class="title">${cur.day} günü</div>
      </div>
      <div class="prog"><b id="prog">${done}/${total}</b><span>set</span></div>
    </div>
    <div class="progress"><div id="progbar" style="width:${total ? (done / total) * 100 : 0}%"></div></div>
    <div class="wk-meta">
      <span>⏱ <span id="elapsed">${elapsedText(cur)}</span></span>
      <span>Kalan tekrar <b>${rirFor(cur.week, cur.deload)}</b></span>
    </div>
    ${cur.longBreak ? `<div class="note warn" style="margin:0 0 12px">${LONG_BREAK_NOTE}</div>` : ''}

    <section class="card safety">
      <button class="safety-btn" data-act="toggle" data-key="safety" aria-expanded="${safeOpen}">
        <span>Güvenlik ve nefes</span><span class="chev">${safeOpen ? '−' : '+'}</span>
      </button>
      ${safeOpen ? `<ul class="bullets"><li>${esc(ALT_NOTE)}</li><li>${esc(BREATH_NOTE)}</li><li>${esc(SESSION_NOTE)}</li></ul>` : ''}
    </section>

    ${renderStep('warmup', 'Isınma', `${WARMUP_MIN} dk`, cur.warmupDone, WARMUP_TIP)}
    ${exHtml}
    ${renderStep('cardio', 'Kardiyo', `${cur.cardioMin} dk`, cur.cardioDone, CARDIO_TIP)}

    <button class="btn good" data-act="finish" style="margin-top:6px">Antrenmanı bitir ve kaydet</button>
    <button class="btn danger" data-act="cancel">Antrenmanı iptal et</button>`;
}

function renderStep(kind, title, dur, done, tip) {
  const key = 'step-' + kind;
  const open = ui.open.has(key);
  return `
    <section class="card step-card ${done ? 'done' : ''}">
      <div class="step">
        <div class="grow">
          <h3>${title}</h3>
          <div class="ex-meta">${dur}</div>
        </div>
        <div class="act">
          <button data-act="step-timer" data-kind="${kind}">Sayaç</button>
          <button class="chk" data-act="step-done" data-kind="${kind}" aria-label="${title} tamamlandı">${CHECK_SVG}</button>
        </div>
      </div>
      <div class="toggles" style="grid-template-columns:1fr">
        <button data-act="toggle" data-key="${key}" class="${open ? 'on' : ''}">${open ? 'Açıklamayı gizle' : 'Ne yapmalıyım?'}</button>
      </div>
      ${open ? `<div class="infobox">${esc(tip)}</div>` : ''}
    </section>`;
}

function supersetPartner(cur, i) {
  const e = cur.exercises[i];
  if (!e.ss) return null;
  const j = cur.exercises.findIndex((x, k) => k !== i && x.ss === e.ss);
  return j >= 0 ? j : null;
}

function renderExercise(cur, e, i) {
  const ex = EX[e.id];
  // "Son" satırı: önce aynı tekrar aralığındaki son kayıt, yoksa hareketin son kaydı (yük azaltma dahil)
  const ref = lastEntry(e.id, (s, x) => sameRange(x.reps, e.reps)) || lastEntry(e.id);

  let lastHtml = '';
  if (ref) {
    const ds = doneSets(ref.entry);
    const vals = ex.weighted
      ? ds.map((s) => `${fmt(s.w)} kg × ${fmt(s.r)}`).join(' · ')
      : ds.map((s) => `${fmt(s.r)} tekrar`).join(' · ');
    lastHtml = `<div class="last">Son: <b>${vals}</b> <span>(${fmtDate(ref.session.finishedAt)}, ${ref.session.day} günü${ref.session.deload ? ', yük azaltma' : ''})</span></div>`;
  }

  let notes = '';
  if (i < PREP_SET_COUNT) notes += `<div class="note blue">${PREP_SET_NOTE}</div>`;
  if (e.bump != null && !cur.deload) {
    notes += `<div class="note warn">⬆ En küçük ağırlık adımını ekle. Geçen sefer ${fmt(e.bump)} kg ile tüm setlerde ${e.reps[1]} tekrara ulaştın; yeni ağırlıkta hedef ${e.reps[0]} tekrar.<span class="note-sub">${esc(BUMP_EXTRA)}</span></div>`;
  }
  if (e.back != null && !cur.deload) {
    notes += `<div class="note warn">↩ Geçen sefer aralığın alt sınırına (${e.reps[0]}) ulaşamadın: önceki ağırlığa dön (${fmt(e.back)} kg).</div>`;
  }
  if (cur.deload && ex.weighted) {
    const pw = e.sets.find((s) => s.pw != null);
    notes += `<div class="note blue">Yük azaltma: ağırlık ~%20 az${pw ? ` (≈${fmt(pw.pw)} kg)` : ''}, 4 tekrar kala bitir. Gri öneri, tike basınca kaydedilir.</div>`;
  }
  if (ex.noFailure) notes += `<div class="note blue">${NO_FAILURE_NOTE}</div>`;
  if (ex.lastSetNote && cur.week >= 6 && !cur.deload) notes += `<div class="note blue">${LAST_SET_NOTE}</div>`;

  const sets = e.sets.map((s, j) => `
    <div class="set ${s.done ? 'done' : ''} ${ex.weighted ? '' : 'noweight'}">
      <span class="n">${j + 1}</span>
      ${ex.weighted ? `<label class="fld"><input data-ex="${i}" data-set="${j}" data-f="w" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${s.w == null ? '' : fmt(s.w)}" placeholder="${s.pw != null ? fmt(s.pw) : '–'}" aria-label="Set ${j + 1} ağırlık"></label>` : ''}
      <label class="fld"><input data-ex="${i}" data-set="${j}" data-f="r" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" value="${s.r == null ? '' : s.r}" placeholder="${s.pr ?? e.reps[0]}" aria-label="Set ${j + 1} tekrar"></label>
      <button class="chk" data-act="check" data-ex="${i}" data-set="${j}" aria-label="Set ${j + 1} tamam">${CHECK_SVG}</button>
    </div>`).join('');

  // Süperset bilgisi
  const partner = supersetPartner(cur, i);
  let restText = `${fmtRest(e.rest)} dinlenme`;
  if (partner != null && e.ssPos === 1) restText = `ardından dinlenmeden ${esc(EX[cur.exercises[partner].id].name)}`;
  if (partner != null && e.ssPos === 2) restText = `ikisi bitince ${fmtRest(e.rest)} dinlenme`;
  const ssTag = partner != null ? `<span class="tag ss-tag">Süperset ${e.ssPos}/2</span>` : '';

  const tipLines = [...(ex.tip || [])];
  if (ex.weighted) tipLines.push(BREATH_NOTE);
  const tipKey = `tip-${i}`, altKey = `alt-${i}`;
  const allDone = e.sets.length && e.sets.every((s) => s.done);
  const toggles = [
    tipLines.length ? `<button data-act="toggle" data-key="${tipKey}" class="${ui.open.has(tipKey) ? 'on' : ''}">Form ipucu</button>` : '',
    ex.alt ? `<button data-act="toggle" data-key="${altKey}" class="${ui.open.has(altKey) ? 'on' : ''}">Alternatif</button>` : '',
  ].filter(Boolean);
  return `
    <article class="card ex ${allDone ? 'all-done' : ''} ${partner != null ? 'in-ss ss' + e.ssPos : ''}" id="ex-${i}">
      <div class="ex-head">
        <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="grow">
          <div class="ex-tags"><span class="kind">${KIND_LABEL[e.kind] || ''}</span>${ssTag}</div>
          <h3>${esc(ex.name)}</h3>
        </div>
      </div>
      <div class="ex-meta">${e.sets.length} set × ${rangeText(e.reps)} tekrar${ex.perSide ? ' (' + ex.perSide + ')' : ''} · ${restText}</div>
      ${lastHtml}
      ${notes}
      <div class="sets">
        <div class="set-head ${ex.weighted ? '' : 'noweight'}"><span></span>${ex.weighted ? '<span>kg</span>' : ''}<span>${ex.perSide === 'her yön' ? 'tekrar / yön' : 'tekrar'}</span><span></span></div>
        ${sets}
      </div>
      <div class="ex-live" id="live-${i}">${renderLive(cur, i)}</div>
      ${toggles.length ? `<div class="toggles" style="grid-template-columns:repeat(${toggles.length},1fr)">${toggles.join('')}</div>` : ''}
      ${ui.open.has(tipKey) ? `<div class="infobox"><strong>Form ipucu</strong>${tipLines.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      ${ui.open.has(altKey) ? `<div class="infobox"><strong>Alternatif</strong><p>${esc(ex.alt)}</p><p class="muted small">${esc(ALT_NOTE)}</p></div>` : ''}
    </article>`;
}

function renderLive(cur, i) {
  if (cur.deload) return '';
  const e = cur.exercises[i];
  if (reachedTop(e.id, e, e.reps[1])) {
    return `<div class="note good">✓ Tüm setlerde ${e.reps[1]} tekrara ulaştın! Sonraki antrenmanda en küçük ağırlık adımını ekle.</div>`;
  }
  return '';
}

function refreshLive(i) {
  const cur = state.current;
  if (!cur) return;
  const live = document.getElementById('live-' + i);
  if (live) live.innerHTML = renderLive(cur, i);
  const { total, done } = countSets(cur);
  const p = $('#prog'); if (p) p.textContent = `${done}/${total}`;
  const b = $('#progbar'); if (b) b.style.width = `${total ? (done / total) * 100 : 0}%`;
}

function renderHistory() {
  if (!state.sessions.length) {
    return `<h1 class="page-title">Geçmiş</h1><div class="empty">Henüz kayıtlı antrenman yok.<br>İlk antrenmanını bitirdiğinde burada görünecek.</div>`;
  }
  const list = [...state.sessions].reverse().map((s) => {
    const rows = s.exercises.map((e) => {
      const ex = EX[e.id];
      const ds = doneSets(e);
      const v = ds.length
        ? ds.map((x) => (ex.weighted ? `${fmt(x.w)}×${fmt(x.r)}` : `${fmt(x.r)}`)).join(' · ')
        : 'yapılmadı';
      return `<div class="hist-ex"><span>${esc(ex.name)}${ex.retired ? ' <span class="muted small">(programdan çıktı)</span>' : ''}</span><span class="v">${v}</span></div>`;
    }).join('');
    return `
      <section class="card">
        <div class="row-between">
          <div class="hist-day">${s.day} günü · Hafta ${s.week} ${s.deload ? '<span class="tag">Yük azaltma</span>' : ''}</div>
          <div class="muted small">${fmtDate(s.finishedAt, true)}</div>
        </div>
        <div class="muted small" style="margin:4px 0 6px">Isınma ${s.warmupDone ? '✓' : '✗'} · Kardiyo ${s.cardioMin} dk ${s.cardioDone ? '✓' : '✗'}</div>
        ${rows}
        <button class="btn danger hist-del" data-act="del-session" data-id="${esc(s.id)}">Bu kaydı sil</button>
      </section>`;
  }).join('');
  return `<h1 class="page-title">Geçmiş</h1>${list}`;
}

/* ---------------- Takip: kilo ve bel ---------------- */

function weekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // Pazartesi = 0
  d.setDate(d.getDate() - dow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weeklyAverages() {
  const groups = new Map();
  state.body.forEach((m) => {
    const k = weekStart(m.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m.kg);
  });
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([start, vals]) => ({ start, avg: vals.reduce((x, y) => x + y, 0) / vals.length, n: vals.length }));
}

function renderTrack() {
  const today = todayStr();
  const thisWeek = weekStart(today);
  const weeks = weeklyAverages();
  const nThisWeek = (weeks.find((w) => w.start === thisWeek) || { n: 0 }).n;
  const lastWaist = state.waist[state.waist.length - 1];
  let waistInfo = 'Henüz ölçüm yok.';
  if (lastWaist) {
    const due = new Date(lastWaist.date + 'T12:00:00');
    due.setDate(due.getDate() + WAIST_EVERY_DAYS);
    const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
    waistInfo = `Son ölçüm: ${fmtDate(lastWaist.date)}. ${dueStr <= today ? 'Ölçüm zamanı geldi.' : `Sıradaki ölçüm: ${fmtDate(dueStr)}.`}`;
  }

  const weekRows = weeks.slice(0, 12).map((w) => {
    const end = new Date(w.start + 'T12:00:00'); end.setDate(end.getDate() + 6);
    return `<div class="hist-ex"><span>${fmtDate(w.start)} – ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span><span class="v">${fmt(Math.round(w.avg * 10) / 10)} kg ort. (${w.n} kayıt)</span></div>`;
  }).join('');

  const entryRows = (list, key, unit) => [...list].reverse().slice(0, 14).map((m) => `
    <div class="hist-ex"><span>${fmtDate(m.date, true)}</span><span class="v">${fmt(m[key])} ${unit}
      <button class="x" data-act="del-measure" data-kind="${key}" data-date="${m.date}" aria-label="${fmtDate(m.date)} kaydını sil">✕</button></span></div>`).join('');

  return `
    <h1 class="page-title">Takip</h1>
    <section class="card">
      <h2>Kilo</h2>
      <p class="muted small" style="margin:4px 0 10px">Hedef: haftada 2-3 kez tartıl, haftalık ortalamaya bak. Bu hafta ${nThisWeek} kayıt.</p>
      <div class="measure-form">
        <input id="bodyDate" type="date" value="${today}" max="${today}" aria-label="Tarih">
        <label class="fld"><input id="bodyVal" type="text" inputmode="decimal" placeholder="kg" autocomplete="off" aria-label="Kilo (kg)"></label>
        <button class="btn" data-act="add-measure" data-kind="kg">Kaydet</button>
      </div>
      ${weeks.length ? `<h3 class="sub">Haftalık ortalama</h3>${weekRows}` : ''}
      ${state.body.length ? `<h3 class="sub">Son kayıtlar</h3>${entryRows(state.body, 'kg', 'kg')}` : ''}
    </section>
    <section class="card">
      <h2>Bel ölçüsü</h2>
      <p class="muted small" style="margin:4px 0 10px">Hedef: iki haftada bir, aynı yerden ölç. ${waistInfo}</p>
      <div class="measure-form">
        <input id="waistDate" type="date" value="${today}" max="${today}" aria-label="Tarih">
        <label class="fld"><input id="waistVal" type="text" inputmode="decimal" placeholder="cm" autocomplete="off" aria-label="Bel ölçüsü (cm)"></label>
        <button class="btn" data-act="add-measure" data-kind="cm">Kaydet</button>
      </div>
      ${state.waist.length ? `<h3 class="sub">Kayıtlar</h3>${entryRows(state.waist, 'cm', 'cm')}` : ''}
    </section>
    ${renderStrength()}`;
}

/** Güç: ana hareketlerde ağırlık ve tekrar artıyor mu? (yük azaltma kayıtları hariç) */
function renderStrength() {
  const seen = new Set();
  const rows = [];
  ['A', 'B'].forEach((d) => PROGRAM[d].filter((sl) => sl.kind === 'main').forEach((sl) => {
    const key = sl.id + sl.reps.join('-');
    if (seen.has(key)) return;
    seen.add(key);
    const hist = strengthHistory(sl.id, sl.reps);
    const recent = hist.slice(-4);
    const chips = recent.length
      ? recent.map((h) => `<span class="chip">${fmt(h.shown.w)}×${h.shown.r}<small>${fmtDate(h.date)}</small></span>`).join('')
      : '<span class="muted small">Henüz kayıt yok</span>';
    rows.push(`
      <div class="str-row">
        <div class="str-name">${esc(EX[sl.id].name)} <span class="muted small">${rangeText(sl.reps)}</span></div>
        <div class="chips">${chips}</div>
        ${noProgress(hist) ? `<div class="note blue">${NO_PROGRESS_NOTE}</div>` : ''}
      </div>`);
  }));
  return `
    <section class="card">
      <h2>Güç</h2>
      <p class="muted small" style="margin:4px 0 6px">Ana hareketlerde ağırlık ve tekrar artıyor mu? Her antrenmanın en iyi seti (kg × tekrar), yük azaltma hariç.</p>
      ${rows.join('')}
    </section>`;
}

function addMeasure(kind) {
  const isKg = kind === 'kg';
  const val = parseNum($(isKg ? '#bodyVal' : '#waistVal').value);
  const date = $(isKg ? '#bodyDate' : '#waistDate').value || todayStr();
  const max = isKg ? 500 : 300;
  if (val == null || val <= 0 || val > max) { toast(isKg ? 'Geçerli bir kilo gir' : 'Geçerli bir ölçü gir'); return; }
  const list = isKg ? state.body : state.waist;
  const i = list.findIndex((m) => m.date === date);
  const item = { date, [kind]: val };
  if (i >= 0) list[i] = item; else list.push(item);
  list.sort((a, b) => a.date.localeCompare(b.date));
  save(); render(); toast('Kaydedildi');
}

function renderSettings() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <h1 class="page-title">Veri</h1>
    <section class="card">
      <h2>Yedekleme</h2>
      <p class="muted small">Kayıtlar yalnızca bu telefonda saklanır. Telefon değiştirirken veya ara sıra güvence için yedek al.</p>
      <button class="btn" data-act="export">Yedeği dışa aktar (JSON)</button>
      <button class="btn" data-act="import">Yedekten içe aktar</button>
      <p class="muted small" style="margin-bottom:0">${state.sessions.length} kayıtlı antrenman${state.current ? ' + 1 devam eden' : ''} · ${state.body.length} kilo · ${state.waist.length} bel kaydı.</p>
    </section>
    ${standalone ? '' : `
    <section class="card">
      <h2>Ana ekrana ekle</h2>
      <p class="muted small" style="margin-bottom:0">Safari’de alttaki <b>Paylaş</b> düğmesine (yukarı ok olan kare) dokun → <b>Ana Ekrana Ekle</b>. Böylece uygulama gibi tam ekran ve internetsiz açılır.</p>
    </section>`}
    <section class="card">
      <h2>Tehlikeli bölge</h2>
      <p class="muted small">Tüm kayıtları bu telefondan siler. Geri alınamaz.</p>
      <button class="btn danger" data-act="wipe">Tüm verileri sil</button>
    </section>
    <p class="muted small" style="text-align:center">IronLog ${APP_VERSION}</p>`;
}

/* ---------------- Toast ---------------- */

let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------------- Dinlenme sayacı ---------------- */

let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) {}
}

function beep() {
  try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (_) {}
  if (!audioCtx) return;
  try {
    const t0 = audioCtx.currentTime;
    [0, 0.35, 0.7].forEach((off) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.25);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + off);
      o.stop(t0 + off + 0.3);
    });
  } catch (_) {}
}

let tick = null;
let finishedHideTimer = null;

function startTimer(sec, label) {
  state.timer = { end: Date.now() + sec * 1000, total: sec, label };
  save();
  clearTimeout(finishedHideTimer);
  $('#timer').classList.remove('finished');
  runTimer();
}

function stopTimer() {
  state.timer = null;
  save();
  clearInterval(tick); tick = null;
  clearTimeout(finishedHideTimer);
  const el = $('#timer');
  el.hidden = true;
  el.classList.remove('finished');
  document.body.classList.remove('timer-on');
}

function runTimer() {
  clearInterval(tick);
  if (!state.timer) return stopTimer();
  $('#timer').hidden = false;
  document.body.classList.add('timer-on');
  updateTimer();
  tick = setInterval(updateTimer, 250);
}

function updateTimer() {
  const t = state.timer;
  if (!t) return;
  const left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
  const el = $('#timer');
  $('.t-label', el).textContent = t.label;
  $('.t-time', el).textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $('.t-fill', el).style.width = `${Math.min(100, (1 - left / t.total) * 100)}%`;
  if (left <= 0) {
    clearInterval(tick); tick = null;
    el.classList.add('finished');
    $('.t-label', el).textContent = t.label.replace(/ dinlenme$/, '') + ' – süre doldu';
    $('.t-time', el).textContent = 'Hazır!';
    beep();
    state.timer = null;
    save();
    finishedHideTimer = setTimeout(stopTimer, 6000);
  }
}

function adjustTimer(delta) {
  if (!state.timer) return;
  state.timer.end += delta * 1000;
  if (delta > 0) state.timer.total += delta;
  save();
  updateTimer();
}

/* ---------------- Ekranın kapanmasını engelle ---------------- */

let wakeLock = null;
async function updateWakeLock() {
  const want = !!state.current && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (_) { wakeLock = null; }
}

/* ---------------- Aksiyonlar ---------------- */

function toggleSet(i, j) {
  const cur = state.current;
  const e = cur.exercises[i];
  const ex = EX[e.id];
  const s = e.sets[j];
  if (s.done) {
    s.done = false;
    save();
    render();
    return;
  }
  if (ex.weighted && s.w == null && s.pw != null) s.w = s.pw; // yük azaltma önerisi
  if (ex.weighted && s.w == null) {
    toast('Önce ağırlığı gir');
    const inp = document.querySelector(`input[data-ex="${i}"][data-set="${j}"][data-f="w"]`);
    if (inp) inp.focus();
    return;
  }
  if (s.r == null) s.r = s.pr ?? e.reps[0];
  s.done = true;
  save();
  const partner = supersetPartner(cur, i);
  if (partner != null && e.ssPos === 1) {
    // Süpersetin ilk hareketi: dinlenmeden ikinciye geç
    stopTimer();
    render();
    toast(`Dinlenmeden: ${EX[cur.exercises[partner].id].name}`);
    const card = document.getElementById('ex-' + partner);
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  startTimer(e.rest, `${ex.name}${partner != null ? ' (süperset)' : ''} · dinlenme`);
  render();
  if (!cur.deload && reachedTop(e.id, e, e.reps[1])) toast('Üst tekrar sınırına ulaştın! Sonraki antrenmanda en küçük ağırlık adımını ekle.', 3500);
}

function finishWorkout() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  if (done === 0) {
    if (!confirm('Hiç set tamamlanmadı. Antrenman kaydedilmeden kapatılsın mı?')) return;
    state.current = null;
  } else {
    if (done < total && !confirm(`${total - done} set tamamlanmadı. Yine de bitirip kaydedeyim mi?`)) return;
    cur.finishedAt = new Date().toISOString();
    state.sessions.push(cur);
    state.current = null;
    toast(`Kaydedildi 💪 Sıradaki: ${nextDayAuto()} günü`, 3500);
  }
  ui.dayChoice = null;
  ui.open.clear();
  stopTimer();
  save();
  render();
  window.scrollTo(0, 0);
}

async function exportData() {
  const payload = { app: 'ironlog', version: DATA_VERSION, exportedAt: new Date().toISOString(), data: state };
  const json = JSON.stringify(payload, null, 2);
  const d = new Date();
  const name = `ironlog-yedek-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'IronLog yedeği' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Yedek indirildi');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = parsed && parsed.data ? parsed.data : parsed;
      const next = normalize(data);
      if (!confirm(`Yedekte ${next.sessions.length} antrenman var. Bu telefondaki mevcut veriler yedektekiyle DEĞİŞTİRİLSİN mi?`)) return;
      state = next;
      save();
      ui.dayChoice = null;
      if (state.timer) runTimer(); else stopTimer();
      render();
      toast('Yedek yüklendi');
    } catch (e) {
      toast('Dosya okunamadı: geçerli bir IronLog yedeği değil.', 3500);
    }
  };
  reader.readAsText(file);
}

/* ---------------- Olaylar ---------------- */

document.addEventListener('click', (ev) => {
  unlockAudio();
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const cur = state.current;

  switch (act) {
    case 'tab':
      ui.tab = el.dataset.tab; render(); window.scrollTo(0, 0); break;
    case 'day':
      ui.dayChoice = el.dataset.day === nextDayAuto() ? null : el.dataset.day; render(); break;
    case 'week':
      state.week = Number(el.dataset.week); save(); render(); break;
    case 'deload':
      state.deloadMode = !state.deloadMode;
      state.deloadSince = state.deloadMode ? new Date().toISOString() : null;
      save(); render();
      toast(state.deloadMode ? 'Yük azaltma açık' : 'Yük azaltma kapalı: program kaldığı yerden devam ediyor');
      break;
    case 'add-measure':
      addMeasure(el.dataset.kind); break;
    case 'del-measure': {
      const isKg = el.dataset.kind === 'kg';
      if (confirm(`${fmtDate(el.dataset.date)} tarihli ${isKg ? 'kilo' : 'bel'} kaydı silinsin mi?`)) {
        if (isKg) state.body = state.body.filter((m) => m.date !== el.dataset.date);
        else state.waist = state.waist.filter((m) => m.date !== el.dataset.date);
        save(); render();
      }
      break;
    }
    case 'start': {
      const day = ui.dayChoice || nextDayAuto();
      state.current = buildSession(day, state.week, state.deloadMode);
      ui.open.clear();
      save(); render(); window.scrollTo(0, 0);
      break;
    }
    case 'check':
      if (cur) toggleSet(Number(el.dataset.ex), Number(el.dataset.set)); break;
    case 'toggle': {
      const k = el.dataset.key;
      ui.open.has(k) ? ui.open.delete(k) : ui.open.add(k);
      render(); break;
    }
    case 'step-timer': {
      if (!cur) break;
      const kind = el.dataset.kind;
      startTimer((kind === 'warmup' ? WARMUP_MIN : cur.cardioMin) * 60, kind === 'warmup' ? 'Isınma' : 'Kardiyo');
      break;
    }
    case 'step-done': {
      if (!cur) break;
      const k = el.dataset.kind === 'warmup' ? 'warmupDone' : 'cardioDone';
      cur[k] = !cur[k];
      save(); render(); break;
    }
    case 'finish':
      if (cur) finishWorkout(); break;
    case 'cancel':
      if (cur && confirm('Antrenman iptal edilsin mi? Bu antrenmanda girdiğin setler silinir.')) {
        state.current = null; stopTimer(); save(); render(); window.scrollTo(0, 0);
      }
      break;
    case 't-minus': adjustTimer(-15); break;
    case 't-plus': adjustTimer(15); break;
    case 't-skip': stopTimer(); break;
    case 'del-session':
      if (confirm('Bu antrenman kaydı silinsin mi?')) {
        state.sessions = state.sessions.filter((s) => s.id !== el.dataset.id);
        save(); render();
      }
      break;
    case 'export': exportData(); break;
    case 'import': $('#importFile').click(); break;
    case 'wipe':
      if (confirm('TÜM kayıtlar (antrenman, kilo, bel) silinsin mi? Bu işlem geri alınamaz.') && confirm('Emin misin? Önce yedek almanı öneririm.')) {
        state = defaultState(); stopTimer(); save(); ui.dayChoice = null; render(); toast('Tüm veriler silindi');
      }
      break;
  }
});

document.addEventListener('focusin', (ev) => {
  const inp = ev.target;
  if (!inp.matches || !inp.matches('input[data-f]') || !state.current) return;
  const s = state.current.exercises[inp.dataset.ex].sets[inp.dataset.set];
  ui.prevW = s.w;
  // Kolay düzenleme için tüm metni seç
  setTimeout(() => { try { inp.select(); } catch (_) {} }, 0);
});

document.addEventListener('input', (ev) => {
  const inp = ev.target;
  if (!inp.matches('input[data-f]') || !state.current) return;
  const s = state.current.exercises[inp.dataset.ex].sets[inp.dataset.set];
  if (inp.dataset.f === 'w') s.w = parseNum(inp.value);
  else s.r = parseNum(inp.value, true);
  save();
});

document.addEventListener('change', (ev) => {
  const inp = ev.target;
  if (inp.id === 'importFile') {
    if (inp.files && inp.files[0]) importData(inp.files[0]);
    inp.value = '';
    return;
  }
  if (!inp.matches('input[data-f]') || !state.current) return;
  const i = Number(inp.dataset.ex), j = Number(inp.dataset.set);
  const e = state.current.exercises[i];
  if (inp.dataset.f === 'w') {
    // Ağırlığı değiştirince, aynı ağırlıktaki sonraki yapılmamış setleri de güncelle
    const oldW = ui.prevW, newW = e.sets[j].w;
    if (newW != null && newW !== oldW) {
      for (let k = j + 1; k < e.sets.length; k++) {
        const s = e.sets[k];
        if (!s.done && s.w === oldW) {
          s.w = newW;
          const other = document.querySelector(`input[data-ex="${i}"][data-set="${k}"][data-f="w"]`);
          if (other) other.value = fmt(newW);
        }
      }
      save();
    }
    ui.prevW = newW;
  }
  refreshLive(i);
});

// Klavyedeki "ileri/bitti" tuşu: sonraki alana geç
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && (ev.target.id === 'bodyVal' || ev.target.id === 'waistVal')) {
    ev.preventDefault();
    addMeasure(ev.target.id === 'bodyVal' ? 'kg' : 'cm');
    return;
  }
  if (ev.key !== 'Enter' || !ev.target.matches('input[data-f]')) return;
  ev.preventDefault();
  const inputs = [...document.querySelectorAll('input[data-f]')];
  const idx = inputs.indexOf(ev.target);
  if (ev.target.dataset.f === 'w' && inputs[idx + 1]) inputs[idx + 1].focus();
  else ev.target.blur();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (state.timer) runTimer();
  }
  updateWakeLock();
});

// Antrenman süresi (hedef ~60 dk)
setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && state.current) el.textContent = elapsedText(state.current);
}, 20000);

/* ---------------- Başlat ---------------- */

render();
if (state.timer) runTimer();

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    // Yeni sürüm devreye girince bir kez yenile (veriler localStorage'da, kaybolmaz)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}
