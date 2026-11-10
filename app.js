'use strict';

/* =========================================================
   IronLog – sade, çevrimdışı çalışan antrenman kayıt uygulaması
   Program tanımı program.js dosyasındadır (PROGRAM nesnesi).
   ========================================================= */

const STORAGE_KEY = 'ironlog.v1';            // Anahtar değişmez: eski kayıtlar aynı yerden okunur
const PRE_V3_BACKUP_KEY = 'ironlog.backup.pre-v3';
const DATA_VERSION = 3;
const APP_VERSION = '4.0.2';
const WAIST_EVERY_DAYS = 14;

/* Eski programın hareket adları: sadece arşivdeki eski kayıtlara isim vermek için (veri geçişinde kullanılır). */
const OLD_NAMES = {
  legpress: 'Leg press', chestpress: 'Göğüs press makinesi', seatedrow: 'Oturarak row makinesi',
  lateral: 'Dumbbell lateral raise', preacher: 'Tek kol dumbbell preacher curl', legcurl: 'Oturarak leg curl',
  latpulldown: 'Lat pulldown', shoulderpress: 'Omuz press makinesi', abduction: 'Hip abduction makinesi',
  deadbug: 'Dead bug', revpecdeck: 'Reverse pec deck (ters kelebek)', hipthrust: 'Hip thrust makinesi',
  pushdown: 'Triceps pushdown',
};

/* ---------------- Yardımcılar ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null ? '–' : String(Math.round(n * 100) / 100).replace('.', ','));
const rangeText = (reps) => (reps[0] === reps[1] ? String(reps[0]) : `${reps[0]}–${reps[1]}`);
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

/* ---------------- Program sorguları ---------------- */

const SESSION_TYPES = PROGRAM.rotation;
const own = (o, k) => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
const sessionDef = (type) => own(PROGRAM.sessions, type);
const exDef = (id) => own(PROGRAM.exercises, id);
const slotDef = (type, key) => (sessionDef(type) ? sessionDef(type).slots.find((s) => s.key === key) : null);

/** Bir setin zorluk hedefi ("1–2 kala", "2 kala", "tükeniş"). */
function effortFor(slot, j, n, deload) {
  const L = PROGRAM.effortLabels;
  if (deload) return L.deload;
  if (slot.effort === 'rir2') return L.rir2;
  if (slot.effort === 'lastFail') return j === n - 1 ? L.fail : L.rir12;
  return L.rir12;
}

const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------------- Durum (localStorage) ---------------- */

function defaultState() {
  return { version: DATA_VERSION, sessions: [], archive: [], current: null, timer: null, body: [], waist: [], migration: null,
    deloadMode: false, deloadSince: null, exSettings: {}, regressionDismissed: null };
}

function normSet(s) {
  if (!s || typeof s !== 'object') return null;
  return { w: parseNum(s.w), r: parseNum(s.r, true), pr: parseNum(s.pr, true), lw: parseNum(s.lw), lr: parseNum(s.lr, true), done: !!s.done };
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

/* --- Yeni (v3) seans kaydı --- */
function normEntry(e) {
  if (!e || typeof e !== 'object' || typeof e.slot !== 'string' || !Array.isArray(e.sets)) return null;
  return {
    slot: e.slot,
    ex: typeof e.ex === 'string' ? e.ex : '',
    name: typeof e.name === 'string' ? e.name : (exDef(e.ex) ? exDef(e.ex).name : e.slot),
    sub: !!e.sub,
    skipped: !!e.skipped,
    sets: e.sets.map(normSet).filter(Boolean),
  };
}

function normSession(s) {
  if (!s || typeof s !== 'object' || typeof s.type !== 'string') return null;
  return {
    id: typeof s.id === 'string' ? s.id : uid(),
    type: s.type,
    name: typeof s.name === 'string' ? s.name : (sessionDef(s.type) ? sessionDef(s.type).name : s.type),
    startedAt: typeof s.startedAt === 'string' ? s.startedAt : new Date().toISOString(),
    finishedAt: typeof s.finishedAt === 'string' ? s.finishedAt : null,
    deload: !!s.deload,
    short: !!s.short,
    note: typeof s.note === 'string' ? s.note.slice(0, 2000) : '',
    longBreak: !!s.longBreak,
    entries: Array.isArray(s.entries) ? s.entries.map(normEntry).filter(Boolean) : [],
  };
}

/* --- Arşiv: eski programın kayıtları (salt okunur) --- */
function archiveFromOld(s, partial) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.exercises)) return null;
  const exercises = s.exercises
    .filter((e) => e && typeof e.id === 'string' && Array.isArray(e.sets))
    .map((e) => ({ id: e.id, name: typeof e.name === 'string' ? e.name : (OLD_NAMES[e.id] || e.id), sets: e.sets.map(normSet).filter(Boolean) }));
  const finishedAt = typeof s.finishedAt === 'string' ? s.finishedAt : (typeof s.startedAt === 'string' ? s.startedAt : null);
  if (!finishedAt) return null;
  return {
    id: typeof s.id === 'string' ? s.id : uid(),
    day: s.day === 'A' || s.day === 'B' ? s.day : '?',
    week: Number.isInteger(s.week) ? s.week : null,
    deload: !!s.deload,
    partial: !!(partial || s.partial),
    finishedAt,
    exercises,
  };
}

/** Her sürümdeki veriyi (v1, v2, v3) bugünkü biçime getirir. Hiçbir kaydı silmez. */
function migrate(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz veri');
  const from = Number(raw.version) || 1;
  const st = defaultState();
  st.body = normMeasures(raw.body, 'kg', 500);
  st.waist = normMeasures(raw.waist, 'cm', 300);
  st.lastBackupAt = typeof raw.lastBackupAt === 'string' ? raw.lastBackupAt : null;

  if (from >= 3) {
    if (!Array.isArray(raw.sessions)) throw new Error('Yedekte seans listesi yok');
    st.sessions = raw.sessions.map(normSession).filter((s) => s && s.finishedAt).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
    st.archive = Array.isArray(raw.archive) ? raw.archive.map((a) => archiveFromOld(a)).filter(Boolean) : [];
    st.current = raw.current ? normSession(raw.current) : null;
    if (st.current) st.current.finishedAt = null;
    if (raw.timer && typeof raw.timer === 'object' && Number.isFinite(raw.timer.end)) {
      st.timer = { end: raw.timer.end, total: Number(raw.timer.total) || 60, label: String(raw.timer.label || '') };
    }
    const m = raw.migration;
    st.migration = m && typeof m === 'object'
      ? { from: Number(m.from) || 1, at: typeof m.at === 'string' ? m.at : '', archived: Number(m.archived) || 0, dismissed: !!m.dismissed }
      : null;
    st.deloadMode = !!raw.deloadMode;
    st.deloadSince = st.deloadMode && typeof raw.deloadSince === 'string' ? raw.deloadSince : null;
    st.regressionDismissed = typeof raw.regressionDismissed === 'string' ? raw.regressionDismissed : null;
    if (raw.exSettings && typeof raw.exSettings === 'object') {
      Object.keys(raw.exSettings).forEach((k) => {
        const v = raw.exSettings[k];
        if (!exDef(k) || !v || typeof v !== 'object') return;
        const stp = typeof v.step === 'number' && Number.isFinite(v.step) && v.step >= 0.25 && v.step <= 50 ? v.step : null;
        st.exSettings[k] = { bigStep: !!v.bigStep, note: typeof v.note === 'string' ? v.note.slice(0, 300) : '', step: stp };
      });
    }
    return st;
  }

  // v1 / v2 (eski A/B programı): tüm antrenmanlar arşive taşınır
  if (!Array.isArray(raw.sessions)) throw new Error('Yedekte antrenman listesi yok');
  st.archive = raw.sessions.map((s) => archiveFromOld(s)).filter(Boolean);
  // Eski programda yarım kalmış antrenman varsa, girilen setler kaybolmasın diye arşive "yarım" olarak eklenir
  if (raw.current && Array.isArray(raw.current.exercises) && raw.current.exercises.some((e) => Array.isArray(e.sets) && e.sets.some((x) => x && x.done))) {
    const a = archiveFromOld(raw.current, true);
    if (a) st.archive.push(a);
  }
  st.archive.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  st.migration = { from, at: new Date().toISOString(), archived: st.archive.length, dismissed: false };
  return st;
}

function load() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return defaultState(); }
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    if ((Number(parsed.version) || 1) < DATA_VERSION) {
      // Geçişten önceki verinin birebir kopyası (bir kez yazılır, üzerine yazılmaz)
      try { if (!localStorage.getItem(PRE_V3_BACKUP_KEY)) localStorage.setItem(PRE_V3_BACKUP_KEY, raw); } catch (_) {}
    }
    const st = migrate(parsed);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch (_) {}
    return st;
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

function nextTypeAuto() {
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return SESSION_TYPES[0];
  const i = SESSION_TYPES.indexOf(last.type);
  return SESSION_TYPES[(i + 1) % SESSION_TYPES.length];
}

const doneSets = (entry) => (entry ? entry.sets.filter((s) => s.done) : []);

/** Aynı seans türündeki aynı hareket yuvasının son kaydı (ör. Üst A'daki lat pulldown yalnızca önceki Üst A ile). */
function lastSlotEntry(type, slotKey, excludeId, beforeIso, nonDeload, sub) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (s.type !== type || s.id === excludeId) continue;
    if (nonDeload && s.deload) continue;
    if (beforeIso && s.finishedAt >= beforeIso) continue;
    // Yedek hareketin kaydı asıl hareketin geçmişine karışmaz (ve tersi)
    const e = s.entries.find((x) => x.slot === slotKey && !!x.sub === !!sub);
    if (e && doneSets(e).length) return { session: s, entry: e };
  }
  return null;
}

function daysSinceLast(now = Date.now()) {
  const last = state.sessions[state.sessions.length - 1];
  return last ? (now - new Date(last.finishedAt).getTime()) / DAY_MS : null;
}

/* ---------------- Seans başlatma ---------------- */

/** Yük azaltmada set sayısı yarıya iner, yukarı yuvarlanır (4→2, 3→2, 2→1). */
const setCount = (sl, deload) => (deload ? Math.max(1, Math.ceil(sl.sets / 2)) : sl.sets);

/** Bir hareket yuvasının setlerini son kayıtla doldurur (sub: yedek hareketin kendi geçmişi). */
function prefillSets(type, sl, count, sub) {
  const ex = exDef(sl.ex);
  const ref = lastSlotEntry(type, sl.key, null, null, true, sub);
  const refSets = ref ? doneSets(ref.entry) : [];
  const sets = [];
  for (let j = 0; j < count; j++) {
    const rs = refSets[j] || refSets[refSets.length - 1] || null;
    const lw = ex.load !== 'bodyweight' && rs && rs.w != null ? rs.w : null;
    const lr = rs && rs.r != null ? rs.r : null;
    const r = lr != null ? lr : sl.reps[0];
    sets.push({ w: lw, r, pr: r, lw, lr, done: false });
  }
  return sets;
}

function buildSession(type, deload, short) {
  const def = sessionDef(type);
  // Kısa seans: her hareketten 1 set düşer (en az 1 kalır), isteğe bağlı hareket (crunch) gizlenir
  const entries = def.slots.filter((sl) => !(short && sl.optional)).map((sl) => {
    const ex = exDef(sl.ex);
    const count = short ? Math.max(1, setCount(sl, deload) - 1) : setCount(sl, deload);
    return { slot: sl.key, ex: sl.ex, name: ex.name, sub: false, skipped: false, sets: prefillSets(type, sl, count, false) };
  });
  const gap = daysSinceLast();
  return { id: uid(), type, name: def.name, startedAt: new Date().toISOString(), finishedAt: null, deload: !!deload, short: !!short, note: '',
    longBreak: gap != null && gap > PROGRAM.longBreak.days, entries };
}

/* ---------------- Öneri mantığı ---------------- */

const exCfg = (exId) => own(state.exSettings, exId) || {};
const bigStepOn = (exId) => !!exCfg(exId).bigStep;
/** Artırma için gereken tekrar: üst sınır (büyük adım açıksa üst sınır + 2). */
const topThreshold = (sl) => sl.reps[1] + (bigStepOn(sl.ex) ? PROGRAM.bigStep.extraReps : 0);

/** Aynı seans türündeki önceki, yük azaltma olmayan kayıt. */
const progressRef = (sess, e) => lastSlotEntry(sess.type, e.slot, sess.id, sess.finishedAt, true, e.sub);

const allAtTop = (entry, thr) => entry.sets.length > 0 && entry.sets.every((x) => x.done && x.r != null && x.r >= thr);
const maxW = (entry) => Math.max(0, ...doneSets(entry).map((x) => x.w || 0));

/** Son kayıttan önceki, daha düşük ağırlıklı kayıt (önceki ağırlığa dönmek için). */
function previousWeight(type, entry, ref) {
  const top = maxW(ref.entry);
  for (let i = state.sessions.indexOf(ref.session) - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (s.type !== type || s.deload) continue;
    const e = s.entries.find((x) => x.slot === entry.slot && !!x.sub === !!entry.sub);
    if (!e || !doneSets(e).length) continue;
    const w = maxW(e);
    if (w > 0 && w < top) return w;
  }
  return null;
}

/** Hareket için öneri: first | bump | back | same. Öneri sadece bilgidir, girişi engellemez. */
function suggestion(sess, e) {
  const sl = slotDef(sess.type, e.slot);
  const ex = exDef(e.ex);
  if (!sl || !ex || sess.deload) return null;
  const ref = progressRef(sess, e);
  if (!ref) return ex.load === 'bodyweight' ? null : { kind: 'first', text: PROGRAM.firstTime };
  if (ex.load === 'bodyweight') return null;
  const thr = topThreshold(sl);
  if (allAtTop(ref.entry, thr)) {
    return { kind: 'bump', text: `Ağırlığı en küçük adımla artır. Geçen sefer ${fmt(maxW(ref.entry))} kg ile bütün setlerde ${thr}${bigStepOn(sl.ex) ? ' (büyük adım: üst sınır + 2)' : ''} tekrara ulaştın. Yeni kiloda tekrarların aralığın altına (${sl.reps[0]}) yakın düşmesi normal; oradan yeniden tırman.` };
  }
  const first = ref.entry.sets[0];
  if (first && first.done && first.r != null && first.r < sl.reps[0]) {
    const back = previousWeight(sess.type, e, ref);
    return { kind: 'back', text: back != null
      ? `Geçen sefer ilk sette alt sınıra (${sl.reps[0]}) ulaşamadın: önceki ağırlığa dön (${fmt(back)} kg).`
      : `Geçen sefer ilk sette alt sınıra (${sl.reps[0]}) ulaşamadın: kiloyu bir kademe azalt.` };
  }
  return { kind: 'same', text: 'Aynı kilo: geçen seferden bir tekrar fazlasını dene.' };
}

/** Bir setin "geçen / hedef" bilgisi. Hedef: aynı kiloda geçen seferden 1 fazla, üst sınırı geçmeden. */
function setTarget(sess, e, j) {
  if (sess.deload || ui.editId) return '';
  const s = e.sets[j];
  const sl = slotDef(sess.type, e.slot);
  if (!sl || s.lr == null) return '';
  const last = s.lw != null ? `${fmt(s.lw)}×${s.lr}` : `${s.lr}`;
  if (s.lw != null && s.w != null && s.w > s.lw) return `Geçen ${last} · yeni kilo, hedef ${sl.reps[0]}+`;
  if (s.lw != null && s.w != null && s.w < s.lw) return `Geçen ${last} · daha hafif kilo, hedef ${sl.reps[0]}–${sl.reps[1]}`;
  return `Geçen ${last} → hedef ${Math.min(s.lr + 1, topThreshold(sl))}`;
}

/** Gerileme: aynı kilolarla, önceki aynı seansa göre toplam tekrar düştü. Kilo artırıldıysa gerileme sayılmaz. */
function regressed(sess, e) {
  const ref = progressRef(sess, e);
  if (!ref) return false;
  const a = doneSets(e), b = doneSets(ref.entry);
  const n = Math.min(a.length, b.length);
  if (!n) return false;
  let ra = 0, rb = 0;
  for (let k = 0; k < n; k++) {
    if ((a[k].w || 0) !== (b[k].w || 0)) return false;
    ra += a[k].r || 0; rb += b[k].r || 0;
  }
  return ra < rb;
}

/** Art arda iki seansta en az üç harekette gerileme varsa, son seansın kimliğini döndürür. */
function regressionWarning() {
  const recent = state.sessions.filter((s) => !s.deload).slice(-2);
  if (recent.length < 2) return null;
  const bad = recent.every((s) => s.entries.filter((e) => regressed(s, e)).length >= 3);
  const id = recent[1].id;
  return bad && state.regressionDismissed !== id ? id : null;
}

/* ---------------- Arayüz durumu ---------------- */

const ui = {
  tab: 'train',
  typeChoice: null,     // Ana ekranda elle seçilen seans (null = otomatik sıra)
  inWorkout: false,     // Seans ekranı açık mı (açılışta yarım seans için "devam et" sorulur)
  editId: null,         // Geçmişten düzenlenen seans
  editBackup: null,
  summary: null,        // Bitirilen seansın özeti
  shortChoice: false,   // Bir sonraki seans kısa mı
  undo: null,
  weekOffset: 0,        // Haftalık özet: kaç hafta geri
  progEx: null,         // İlerleme görünümünde seçili hareket
  open: new Set(),      // Açık kutular
  prevW: null,
};

/* ---------------- Render ---------------- */

function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const app = $('#app');
  if (ui.tab === 'history') app.innerHTML = ui.editId ? renderWorkout() : renderHistory();
  else if (ui.tab === 'track') app.innerHTML = renderTrack();
  else if (ui.tab === 'settings') app.innerHTML = renderSettings();
  else app.innerHTML = state.current && ui.inWorkout ? renderWorkout() : renderHome();
  updateWakeLock();
}

function renderMigrationBanner() {
  const m = state.migration;
  if (!m || m.dismissed) return '';
  return `
    <section class="card migrate">
      <div class="eyebrow">Yeni program</div>
      <p style="margin:6px 0 10px">Uygulama yeni 4 seanslık programa geçti. Eski programın ${m.archived} antrenmanı silinmedi; <b>Geçmiş → Arşiv</b> bölümünde duruyor. Kilo ve bel kayıtların yerinde.</p>
      <button class="btn" data-act="dl-pre-backup">Geçiş öncesi yedeği indir</button>
      <button class="btn ghost" data-act="dismiss-migration">Tamam, gizle</button>
    </section>`;
}

function renderDeloadCard() {
  const dl = state.deloadMode;
  const days = dl && state.deloadSince ? (Date.now() - new Date(state.deloadSince).getTime()) / DAY_MS : 0;
  const open = ui.open.has('deload-info');
  return `
    <section class="card">
      <div class="row-between">
        <h2>Bu hafta yük azalt</h2>
        <button class="switch ${dl ? 'on' : ''}" data-act="deload" role="switch" aria-checked="${dl}" aria-label="Bu hafta yük azalt"><span></span></button>
      </div>
      <p class="muted small" style="margin:8px 0 0">${PROGRAM.deload.how.slice(0, 3).map(esc).join(' ')}</p>
      ${days >= 7 ? '<div class="note warn">1 hafta doldu: sonraki hafta normal programa, bıraktığın kilolarla dön.</div>' : ''}
      <button class="linkbtn" data-act="toggle" data-key="deload-info">${open ? 'Gizle' : 'Ne zaman yapılır?'}</button>
      ${open ? `<div class="infobox">${PROGRAM.deload.when.map((l) => `<p>${esc(l)}</p>`).join('')}<p>${esc(PROGRAM.deload.how[3])}</p></div>` : ''}
    </section>`;
}

function renderRules() {
  const open = ui.open.has('rules');
  const body = PROGRAM.generalRules.map((r) => `
      <h3 class="sub">${esc(r.title)}</h3>
      ${r.table ? `<table class="rules-table"><thead><tr><th>${esc(r.table.head[0])}</th><th>${esc(r.table.head[1])}</th></tr></thead><tbody>${r.table.rows.map((row) => `<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td></tr>`).join('')}</tbody></table>` : ''}
      ${r.lines.map((l) => `<p>${esc(l)}</p>`).join('')}`).join('');
  return `
    <section class="card safety">
      <button class="safety-btn" data-act="toggle" data-key="rules" aria-expanded="${open}">
        <span>Genel kurallar</span><span class="chev">${open ? '−' : '+'}</span>
      </button>
      ${open ? `<div class="rules">${body}</div>` : ''}
    </section>`;
}

function renderHome() {
  const auto = nextTypeAuto();
  const type = ui.typeChoice || auto;
  const def = sessionDef(type);
  const last = state.sessions[state.sessions.length - 1];

  const typeBtns = SESSION_TYPES.map((t) => `
    <button data-act="type" data-type="${t}" class="${t === type ? 'on' : ''}">${esc(sessionDef(t).name)}</button>`).join('');

  const items = def.slots.map((sl) => {
    const ex = exDef(sl.ex);
    const ss = sl.ss ? `<span class="ss-mark">${sl.ssPos === 1 ? 'Süperset' : '+'}</span>` : '';
    const side = ex.perSide ? ' her kol' : '';
    return `<li class="${sl.ss ? 'ss ss' + sl.ssPos : ''}"><span>${ss}${esc(ex.name)}${sl.optional ? ' <span class="muted small">(isteğe bağlı)</span>' : ''}</span><span class="meta">${sl.sets} × ${rangeText(sl.reps)}${side}</span></li>`;
  }).join('');

  return `
    <header class="brand">
      <div class="logo">IRON<span>LOG</span></div>
      <div class="brand-sub">${esc(PROGRAM.name)}</div>
    </header>
    ${renderMigrationBanner()}
    ${backupDue() ? `<button class="backup-hint" data-act="go-backup">💾 Son yedeğin üzerinden 14 günden fazla geçti. <b>Yedek al</b></button>` : ''}
    ${renderSummary()}
    ${state.current ? renderResume() : ''}

    <section class="card hero ${state.current ? 'dim' : ''}">
      <div class="eyebrow">Sıradaki seans</div>
      <div class="hero-row">
        <div class="hero-day">${esc(def.name.split(' ')[1] || '')}</div>
        <div class="hero-info">
          <div class="hero-title">${esc(def.name)}</div>
          <div class="muted small">${def.slots.length} hareket</div>
        </div>
      </div>
      <div class="seg seg4">${typeBtns}</div>
      ${state.current ? '' : `<div class="row-between short-row">
        <div><b>Kısa seans</b><div class="muted small">Her hareketten 1 set az, crunch yok. Süpersetler kalır.</div></div>
        <button class="switch ${ui.shortChoice ? 'on' : ''}" data-act="short" role="switch" aria-checked="${!!ui.shortChoice}" aria-label="Kısa seans"><span></span></button>
      </div>`}
      <div class="muted small" style="margin-top:12px">
        ${last ? `Son seans: ${esc(last.name)}, ${fmtDate(last.finishedAt, true)}. ` : 'Yeni programda henüz kayıtlı seans yok. '}
        Otomatik sıra: <b>${esc(sessionDef(auto).name)}</b>${ui.typeChoice && ui.typeChoice !== auto ? ' (elle değiştirdin)' : ''}
      </div>
      ${state.deloadMode ? '<div class="note blue">Yük azaltma açık: setler yarıya iner, her set 3 tekrar kala.</div>' : ''}
      ${(() => { const g = daysSinceLast(); return g != null && g > PROGRAM.longBreak.days ? `<div class="note warn">${esc(PROGRAM.longBreak.text)}</div>` : ''; })()}
    </section>
    ${(() => { const w = state.deloadMode ? null : regressionWarning(); return w ? `<section class="card calm">
      <p style="margin:0 0 10px">Birkaç harekette gerileme var; yük azaltma haftası düşünebilirsin.</p>
      <button class="btn ghost" data-act="dismiss-regression" data-id="${esc(w)}">Kapat</button>
    </section>` : ''; })()}

    <section class="card">
      <h2>${esc(def.name)} planı</h2>
      <p class="muted small" style="margin:4px 0 0">${esc(def.about)}</p>
      <ul class="plan-list">${items}</ul>
    </section>

    ${renderDeloadCard()}

    ${renderRules()}

    ${state.current ? '' : `<div class="sticky-cta">
      <button class="btn primary" data-act="start">${esc(def.name)}${ui.shortChoice ? ' (kısa)' : ''} seansına başla</button>
    </div>`}`;
}

/* ---------------- Seans ekranı ---------------- */

/** Ekranda açık olan seans: canlı seans ya da geçmişten düzenlenen seans. */
function activeSess() {
  if (ui.editId) return state.sessions.find((s) => s.id === ui.editId) || null;
  return state.current;
}

function countSets(sess) {
  let total = 0, done = 0;
  sess.entries.forEach((e) => {
    const sl = slotDef(sess.type, e.slot);
    if (!sl || !exDef(e.ex)) return; // programdan çıkarılmış hareket: ekranda yok, eksik de sayılmaz
    const opt = sl.optional;
    e.sets.forEach((s) => { if (!opt) total++; if (s.done && !opt) done++; });
  });
  return { total, done };
}

function elapsedText(sess) {
  const end = sess.finishedAt ? new Date(sess.finishedAt).getTime() : Date.now();
  const min = Math.max(0, Math.floor((end - new Date(sess.startedAt).getTime()) / 60000));
  return `${min} dk`;
}

function weightStep(exId) {
  const custom = exCfg(exId).step;
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) return custom;
  const ex = exDef(exId);
  const ls = ex && PROGRAM.loadSteps[ex.load];
  return ls ? ls.step : 0;
}

function renderWorkout() {
  const sess = activeSess();
  const edit = !!ui.editId;
  const { total, done } = countSets(sess);
  return `
    <div class="wk-head">
      <div>
        <div class="eyebrow">${edit ? `Düzenleme · ${fmtDate(sess.finishedAt, true)}` : 'Seans'}${sess.deload ? ' · yük azaltma' : ''}${sess.short ? ' · kısa seans' : ''}</div>
        <div class="title">${esc(sess.name)}</div>
      </div>
      <div class="prog"><b id="prog">${done}/${total}</b><span>set</span></div>
    </div>
    <div class="progress"><div id="progbar" style="width:${total ? (done / total) * 100 : 0}%"></div></div>
    <div class="wk-meta"><span>⏱ <span id="elapsed">${elapsedText(sess)}</span></span>${edit ? '<span>Değişiklikler hemen kaydedilir</span>' : ''}</div>
    ${sess.longBreak && !edit ? `<div class="note warn" style="margin:0 0 12px">${esc(PROGRAM.longBreak.text)}</div>` : ''}

    ${sess.entries.map((e, i) => renderExercise(sess, e, i)).join('')}

    <section class="card">
      <label class="note-label" for="sessNote">Seans notu</label>
      <textarea id="sessNote" class="text-in" rows="3" maxlength="2000" placeholder="Bugüne özel not (örn. salon kalabalıktı, sırayı değiştirdim)">${esc(sess.note || '')}</textarea>
    </section>

    ${edit ? `
      <button class="btn good" data-act="edit-done" style="margin-top:6px">Düzenlemeyi bitir</button>
      <button class="btn danger" data-act="edit-revert">Değişiklikleri geri al</button>` : `
      <button class="btn good" data-act="finish" style="margin-top:6px">Seansı bitir ve kaydet</button>
      <button class="btn danger" data-act="cancel">Seansı iptal et</button>`}`;
}

function supersetPartner(sess, i) {
  const sl = slotDef(sess.type, sess.entries[i].slot);
  if (!sl || !sl.ss) return null;
  const j = sess.entries.findIndex((x, k) => k !== i && (slotDef(sess.type, x.slot) || {}).ss === sl.ss);
  return j >= 0 ? j : null;
}

function renderForm(ex) {
  return ex.form.map((f) => {
    const label = f.label ? `<b>${esc(f.label)}:</b> ` : '';
    const steps = f.steps && f.steps.length ? `<ol>${f.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    return `<div class="form-part">${label}${esc(f.text)}${steps}</div>`;
  }).join('');
}

const MINUS_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>';
const PLUS_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>';

function stepper(i, j, f, value, label) {
  return `
    <div class="stepper">
      <button class="sbtn" data-act="step" data-ex="${i}" data-set="${j}" data-f="${f}" data-d="-1" aria-label="${label} azalt">${MINUS_SVG}</button>
      <input data-ex="${i}" data-set="${j}" data-f="${f}" type="text" inputmode="${f === 'w' ? 'decimal' : 'numeric'}" ${f === 'r' ? 'pattern="[0-9]*"' : ''} autocomplete="off" value="${value == null ? '' : (f === 'w' ? fmt(value) : value)}" placeholder="–" aria-label="${label}">
      <button class="sbtn" data-act="step" data-ex="${i}" data-set="${j}" data-f="${f}" data-d="1" aria-label="${label} artır">${PLUS_SVG}</button>
    </div>`;
}

/** Isınma setleri: çalışma kilosunun yüzdesiyle hesaplanır (kaydedilmez). */
function warmupHtml(sl, e, i) {
  if (!sl.warmup) return '';
  const ex = exDef(e.ex);
  const w = e.sets.length ? e.sets[0].w : null;
  const step = weightStep(e.ex) || 0.5;
  const parts = (sl.warmup.plan || []).map((p) => {
    if (p.bar) return `Boş bar × ${p.reps}`;
    if (p.light) return `Çok hafif × ${p.reps}`;
    if (w == null || e.sub) return `%${p.pct} × ${p.reps}`;
    const kg = Math.max(0, Math.round((w * p.pct) / 100 / step) * step);
    return `≈${fmt(Math.round(kg * 100) / 100)} kg (%${p.pct}) × ${p.reps}`;
  });
  return `<div class="note blue warm" id="warm-${i}"><b>Isınma (kaydedilmez):</b> ${parts.length ? `<span class="warm-sets">${parts.map(esc).join(' → ')}</span>` : ''}<span class="note-sub2">${esc(sl.warmup.text)}</span></div>`;
}

function renderExercise(sess, e, i) {
  const sl = slotDef(sess.type, e.slot);
  const ex = exDef(e.ex);
  if (!sl || !ex) return '';
  const n = e.sets.length;
  const bodyweight = ex.load === 'bodyweight';
  const live = !ui.editId;
  const title = e.sub ? ex.sub : ex.name;
  const cfg = exCfg(e.ex);

  // İsteğe bağlı hareket bugün atlandıysa küçük kart
  if (e.skipped) {
    return `
    <article class="card ex skipped" id="ex-${i}">
      <div class="row-between"><div><span class="kind">${esc(ex.muscle)}</span><h3>${esc(title)}</h3><div class="muted small">Bugün atlandı</div></div>
      <button class="btn ghost mini" data-act="skip" data-ex="${i}">Geri al</button></div>
    </article>`;
  }

  const ref = lastSlotEntry(sess.type, sl.key, sess.id, sess.finishedAt, false, e.sub);
  let lastHtml;
  if (ref) {
    const ds = doneSets(ref.entry);
    const vals = bodyweight ? ds.map((s) => `${fmt(s.r)}`).join(' · ') : ds.map((s) => `${fmt(s.w)}×${fmt(s.r)}`).join(' · ');
    lastHtml = `<div class="last">Son ${esc(sess.name)}${e.sub ? ' (yedek)' : ''}: <b>${vals}</b> <span>(${fmtDate(ref.session.finishedAt)}${ref.session.deload ? ', yük azaltma' : ''})</span></div>`;
  } else {
    lastHtml = `<div class="last">${e.sub ? 'Bu yedek hareketin' : 'Bu seansta'} henüz kaydı yok.</div>`;
  }

  let notes = '';
  const sug = live ? suggestion(sess, e) : null;
  if (sug) notes += `<div class="note ${sug.kind === 'bump' || sug.kind === 'back' ? 'warn' : 'blue'} sug sug-${sug.kind}">${sug.kind === 'bump' ? '⬆ ' : sug.kind === 'back' ? '↩ ' : ''}${esc(sug.text)}</div>`;
  if (sess.deload) notes += `<div class="note blue">Yük azaltma: kilolar aynı, ${n} set, her set 3 tekrar kala bitir; tükeniş yok.</div>`;
  if (live) notes += warmupHtml(sl, e, i);
  if (sl.effortNote) notes += `<div class="note blue">${esc(sl.effortNote)}</div>`;
  if (sl.note && !e.sub) notes += `<div class="note blue">${esc(sl.note)}</div>`;

  const partner = supersetPartner(sess, i);
  let restText = sl.restNote ? esc(sl.restNote) : `${fmtRest(sl.rest)} dinlenme`;
  if (partner != null && sl.ssPos === 1) restText = `ardından dinlenmeden ${esc(sess.entries[partner].sub ? exDef(sess.entries[partner].ex).sub : exDef(sess.entries[partner].ex).name)}`;
  if (partner != null && sl.ssPos === 2) restText = `tur bitince ${fmtRest(sl.rest)} dinlenme`;
  const tags = [
    e.sub ? '<span class="tag">Yedek</span>' : '',
    partner != null ? `<span class="tag ss-tag">Süperset ${sl.ssPos}/2</span>` : '',
    sl.optional ? '<span class="tag">İsteğe bağlı</span>' : '',
    ex.perSide ? '<span class="tag">Her kol</span>' : '',
  ].join('');

  const sets = e.sets.map((s, j) => {
    const eff = effortFor(sl, j, n, sess.deload);
    const tgt = setTarget(sess, e, j);
    return `
    <div class="set2 ${s.done ? 'done' : ''}" id="set-${i}-${j}">
      <div class="set2-top">
        <span class="sn">Set ${j + 1}</span>
        <span class="eff ${eff === PROGRAM.effortLabels.fail ? 'fail' : ''}">${esc(eff)}</span>
        <span class="grow"></span>
        <button class="chk" data-act="check" data-ex="${i}" data-set="${j}" aria-label="Set ${j + 1} ${s.done ? 'tiki kaldır' : 'tamam'}">${CHECK_SVG}</button>
      </div>
      ${tgt ? `<div class="tgt" id="tgt-${i}-${j}">${esc(tgt)}</div>` : ''}
      <div class="set2-row ${bodyweight ? 'bw' : ''}">
        ${bodyweight ? '' : stepper(i, j, 'w', s.w, `Set ${j + 1} ağırlık`)}
        ${stepper(i, j, 'r', s.r, `Set ${j + 1} tekrar`)}
      </div>
    </div>`;
  }).join('');

  const formKey = `form-${i}`, subKey = `sub-${i}`, cfgKey = `cfg-${i}`;
  const toggles = [
    e.sub ? '' : `<button data-act="toggle" data-key="${formKey}" class="${ui.open.has(formKey) ? 'on' : ''}">Form</button>`,
    (ex.sub || e.sub) && live ? `<button data-act="toggle" data-key="${subKey}" class="${ui.open.has(subKey) ? 'on' : ''}">Alet doluysa</button>` : '',
    `<button data-act="toggle" data-key="${cfgKey}" class="${ui.open.has(cfgKey) ? 'on' : ''}">Ayar</button>`,
  ].filter(Boolean);
  const big = bigStepOn(e.ex);
  const allDone = n && e.sets.every((s) => s.done);

  const subBox = `<div class="infobox"><strong>Alet doluysa</strong>
      <p>Önce sırayı değiştir: bir sonraki hareketi yapıp geri dön. Alet uzun süre boşalmayacaksa o günlük yedeği kullan; set, tekrar ve zorluk aynı kalır.</p>
      ${ex.sub ? `<p><b>Yedek:</b> ${esc(ex.sub)}</p>` : ''}
      <div class="btn-grid">
        <button class="btn mini" data-act="move" data-mode="next" data-ex="${i}">Sonrakiyle yer değiştir</button>
        <button class="btn mini" data-act="move" data-mode="end" data-ex="${i}">Sona al</button>
        ${ex.noSub ? '' : `<button class="btn mini ${e.sub ? '' : 'red'}" data-act="sub" data-ex="${i}">${e.sub ? 'Asıl harekete dön' : 'Bugün yedeğini yap'}</button>`}
      </div>
      <p class="muted small" style="margin-top:8px">Sıra değişikliği sadece bugün için; program sırası değişmez. Yedeğin kaydı asıl hareketin geçmişine karışmaz.</p>
    </div>`;
  const cfgBox = `<div class="infobox"><strong>Hareket ayarı (kalıcı)</strong>
      <label class="note-label" for="exnote-${i}">Makine ayarı notu</label>
      <input class="text-in" id="exnote-${i}" data-exnote="${e.ex}" type="text" maxlength="300" placeholder="örn. koltuk 4, pim 3. delik" value="${esc(cfg.note || '')}">
      ${bodyweight ? '' : (() => {
        const defStep = fmt((PROGRAM.loadSteps[ex.load] || {}).step || 0);
        return `<label class="note-label" for="exstep-${i}" style="margin-top:12px">Ağırlık adımı (kg)</label>
      <input class="text-in" id="exstep-${i}" data-exstep="${e.ex}" type="text" inputmode="decimal" autocomplete="off" maxlength="5" placeholder="${defStep}" value="${cfg.step ? fmt(cfg.step) : ''}">
      <p class="muted small" style="margin-top:6px">Bu makinede artı/eksi düğmesinin kaç kg değiştireceği. Makinenin bir plakası kaç kg ise onu yaz. Boş bırakırsan varsayılan (${defStep} kg) kullanılır.</p>`;
      })()}
      ${bodyweight ? '' : `<div class="row-between" style="margin-top:12px"><span>Büyük ağırlık adımı</span><button class="switch ${big ? 'on' : ''}" data-act="bigstep" data-ex-id="${e.ex}" role="switch" aria-checked="${big}" aria-label="Büyük ağırlık adımı"><span></span></button></div>
      <p class="muted small" style="margin-top:8px">Açıkken artırma önerisi, bütün setlerde üst sınırın 2 tekrar üstüne (${sl.reps[1] + PROGRAM.bigStep.extraReps}) çıkınca verilir. ${esc(PROGRAM.bigStep.text)}</p>`}
    </div>`;

  return `
    <article class="card ex ${allDone ? 'all-done' : ''} ${partner != null ? 'in-ss ss' + sl.ssPos : ''}" id="ex-${i}">
      <div class="ex-head">
        <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="grow">
          <div class="ex-tags"><span class="kind">${esc(ex.muscle)}</span>${tags}</div>
          <h3>${esc(title)}</h3>
          ${cfg.note ? `<div class="machine-note">⚙ ${esc(cfg.note)}</div>` : ''}
        </div>
      </div>
      <div class="ex-meta">${n} set × ${rangeText(sl.reps)} tekrar${ex.perSide ? ' (her kol)' : ''} · ${restText}</div>
      ${lastHtml}
      ${notes}
      <div class="sets">
        <div class="set2-head ${bodyweight ? 'bw' : ''}">${bodyweight ? '' : `<span>kg <small>(±${fmt(weightStep(e.ex))})</small></span>`}<span>${ex.perSide ? 'tekrar / kol' : 'tekrar'}</span></div>
        ${sets}
      </div>
      ${sl.optional && live ? `<button class="btn ghost mini" data-act="skip" data-ex="${i}" style="margin-top:10px">Bugün atla</button>` : ''}
      <div class="toggles" style="grid-template-columns:repeat(${toggles.length},1fr)">${toggles.join('')}</div>
      ${ui.open.has(formKey) && !e.sub ? `<div class="infobox"><strong>Form</strong>${renderForm(ex)}</div>` : ''}
      ${ui.open.has(subKey) ? subBox : ''}
      ${ui.open.has(cfgKey) ? cfgBox : ''}
    </article>`;
}

function refreshProgress() {
  const sess = activeSess();
  if (!sess) return;
  const { total, done } = countSets(sess);
  const p = $('#prog'); if (p) p.textContent = `${done}/${total}`;
  const b = $('#progbar'); if (b) b.style.width = `${total ? (done / total) * 100 : 0}%`;
}

/** Bir hareketin en iyi performansı: en yüksek kilo, eşitse o kilodaki toplam tekrar. */
function perf(entry, bodyweight) {
  const ds = doneSets(entry);
  if (!ds.length) return null;
  if (bodyweight) return { w: 0, r: ds.reduce((a, s) => a + (s.r || 0), 0) };
  const w = Math.max(...ds.map((s) => s.w || 0));
  return { w, r: ds.filter((s) => (s.w || 0) === w).reduce((a, s) => a + (s.r || 0), 0) };
}

/** Seans özeti: süre, tamamlanan set, geçen sefere göre artan hareketler. */
function sessionSummary(sess) {
  const { done } = countSets(sess);
  const optDone = sess.entries.filter((e) => (slotDef(sess.type, e.slot) || {}).optional).reduce((a, e) => a + doneSets(e).length, 0);
  const improved = [];
  sess.entries.forEach((e) => {
    const bw = exDef(e.ex) && exDef(e.ex).load === 'bodyweight';
    const now = perf(e, bw);
    const ref = sess.deload ? null : progressRef(sess, e);
    const before = ref && perf(ref.entry, bw);
    if (now && before && (now.w > before.w || (now.w === before.w && now.r > before.r))) {
      improved.push(bw ? `${e.name}: ${before.r} → ${now.r} tekrar` : (now.w > before.w ? `${e.name}: ${fmt(before.w)} → ${fmt(now.w)} kg` : `${e.name}: ${fmt(now.w)} kg'da ${before.r} → ${now.r} tekrar`));
    }
  });
  return { name: sess.name, minutes: elapsedText(sess), sets: done + optDone, improved };
}

function renderSummary() {
  const s = ui.summary;
  if (!s) return '';
  return `
    <section class="card summary">
      <div class="eyebrow">Seans bitti</div>
      <h2 style="margin-top:4px">${esc(s.name)}</h2>
      <div class="stat-row">
        <div class="stat"><b>${esc(s.minutes)}</b><span>Süre</span></div>
        <div class="stat"><b>${s.sets}</b><span>Set</span></div>
        <div class="stat accent"><b>${s.improved.length}</b><span>Artan</span></div>
      </div>
      ${s.improved.length ? `<ul class="bullets plain">${s.improved.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted small" style="margin:10px 0 0">Geçen sefere göre artan hareket yok ya da bu seansın ilk kaydı.</p>'}
      <button class="btn ghost" data-act="close-summary" style="margin-top:10px">Tamam</button>
    </section>`;
}

function renderResume() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  return `
    <section class="card hero resume">
      <div class="eyebrow">Yarım kalan seans</div>
      <div class="hero-title" style="margin-top:6px">${esc(cur.name)}</div>
      <p class="muted small" style="margin:4px 0 12px">${fmtDate(cur.startedAt, true)} başladı · ${done}/${total} set tamam</p>
      <button class="btn primary" data-act="resume">Seansa devam et</button>
      <button class="btn" data-act="finish">Bitir ve kaydet</button>
      <button class="btn danger" data-act="cancel">İptal et</button>
    </section>`;
}

function renderHistory() {
  const list = [...state.sessions].reverse().map((s) => {
    const rows = s.entries.map((e) => {
      const ds = doneSets(e);
      const bw = exDef(e.ex) && exDef(e.ex).load === 'bodyweight';
      const v = ds.length ? ds.map((x) => (bw ? `${fmt(x.r)}` : `${fmt(x.w)}×${fmt(x.r)}`)).join(' · ') : 'yapılmadı';
      const label = e.skipped ? 'atlandı' : v;
      return `<div class="hist-ex"><span>${e.sub ? '<span class="tag">Yedek</span> ' : ''}${esc(e.name)}</span><span class="v">${label}</span></div>`;
    }).join('');
    return `
      <section class="card">
        <div class="row-between">
          <div class="hist-day">${esc(s.name)}${s.deload ? ' <span class="tag">Yük azaltma</span>' : ''}${s.short ? ' <span class="tag">Kısa</span>' : ''}</div>
          <div class="muted small">${fmtDate(s.finishedAt, true)}</div>
        </div>
        ${rows}
        ${s.note ? `<div class="hist-note">📝 ${esc(s.note)}</div>` : ''}
        <div class="hist-actions">
          <button class="btn hist-del" data-act="edit-session" data-id="${esc(s.id)}">Düzenle</button>
          <button class="btn danger hist-del" data-act="del-session" data-id="${esc(s.id)}">Sil</button>
        </div>
      </section>`;
  }).join('');

  const archOpen = ui.open.has('archive');
  const arch = state.archive.length ? `
    <section class="card safety">
      <button class="safety-btn" data-act="toggle" data-key="archive" aria-expanded="${archOpen}">
        <span>Arşiv: eski program (${state.archive.length} antrenman)</span><span class="chev">${archOpen ? '−' : '+'}</span>
      </button>
      ${archOpen ? `<div class="rules">${[...state.archive].reverse().map((a) => `
        <div class="arch">
          <div class="row-between"><b>${a.day} günü${a.week ? ' · Hafta ' + a.week : ''}${a.deload ? ' · yük azaltma' : ''}${a.partial ? ' · yarım kaldı' : ''}</b><span class="muted small">${fmtDate(a.finishedAt, true)}</span></div>
          ${a.exercises.map((e) => { const ds = doneSets(e); return `<div class="hist-ex"><span>${esc(e.name)}</span><span class="v">${ds.length ? ds.map((x) => (x.w != null ? `${fmt(x.w)}×${fmt(x.r)}` : fmt(x.r))).join(' · ') : 'yapılmadı'}</span></div>`; }).join('')}
        </div>`).join('')}</div>` : ''}
    </section>` : '';

  if (!state.sessions.length && !arch) {
    return `<h1 class="page-title">Geçmiş</h1><div class="empty">Henüz kayıtlı seans yok.<br>İlk seansını bitirdiğinde burada görünecek.</div>`;
  }
  return `<h1 class="page-title">Geçmiş</h1>${list || '<p class="muted">Yeni programda henüz kayıtlı seans yok.</p>'}${arch}`;
}

function renderSettings() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <h1 class="page-title">Veri</h1>
    <section class="card">
      <h2>Yedekleme</h2>
      <p class="muted small">Kayıtlar yalnızca bu telefonda saklanır. Telefon değiştirirken veya ara sıra güvence için yedek al.</p>
      <button class="btn" data-act="export">Veriyi dışa aktar (JSON)</button>
      <button class="btn" data-act="import">Veriyi içe aktar</button>
      <p class="muted small">${state.lastBackupAt ? `Son yedek: ${fmtDate(state.lastBackupAt, true)}.` : 'Henüz bu cihazdan yedek alınmadı.'}</p>
      <p class="muted small" style="margin-bottom:0">${state.sessions.length} seans${state.current ? ' + 1 devam eden' : ''} · ${state.archive.length} arşiv · ${state.body.length} kilo · ${state.waist.length} bel kaydı.</p>
    </section>
    ${hasPreBackup() ? `
    <section class="card">
      <h2>Geçiş öncesi yedek</h2>
      <p class="muted small">Yeni programa geçmeden önceki verinin birebir kopyası.</p>
      <button class="btn" data-act="dl-pre-backup">İndir</button>
    </section>` : ''}
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

function hasPreBackup() {
  try { return !!localStorage.getItem(PRE_V3_BACKUP_KEY); } catch (_) { return false; }
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
    ${renderWeekSummary()}
    ${renderProgress()}
    <section class="card">
      <h2>Kilo</h2>
      <p class="muted small" style="margin:4px 0 10px">Haftada birkaç kez sabah aç karnına tartıl ve haftalık ortalamaya bak. Bu hafta ${nThisWeek} kayıt.</p>
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
`;
}

/* ---------------- Takip: haftalık özet ve hareket ilerlemesi ---------------- */

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const localDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Pazartesi–pazar haftası: yapılan seans sayısı ve kas grubu başına tamamlanan set (ısınma hariç). */
function weekStats(startStr) {
  const endStr = addDays(startStr, 7);
  const sessions = state.sessions.filter((s) => { const d = localDate(s.finishedAt); return d >= startStr && d < endStr; });
  const sets = {};
  Object.keys(PROGRAM.weeklyTargets).forEach((k) => { sets[k] = 0; });
  sessions.forEach((s) => s.entries.forEach((e) => {
    if (e.skipped) return;
    const ex = exDef(e.ex);
    if (!ex) return;
    sets[ex.muscle] = (sets[ex.muscle] || 0) + doneSets(e).length;
  }));
  return { sessions, sets };
}

function renderWeekSummary() {
  const off = ui.weekOffset || 0;
  const start = addDays(weekStart(todayStr()), -7 * off);
  const end = addDays(start, 6);
  const st = weekStats(start);
  const perWeek = PROGRAM.rotation.length;
  const rows = Object.entries(PROGRAM.weeklyTargets).map(([m, target]) => {
    const v = st.sets[m] || 0;
    const pct = Math.min(100, Math.round((v / target) * 100));
    return `<div class="wk-row"><span class="wk-m">${esc(m)}</span><span class="wk-bar"><span style="width:${pct}%"></span></span><span class="wk-v ${v >= target ? 'full' : ''}">${v}/${target}</span></div>`;
  }).join('');
  return `
    <section class="card">
      <div class="row-between">
        <h2>Haftalık özet</h2>
        <div class="wk-nav">
          <button class="x" data-act="week-nav" data-d="1" aria-label="Önceki hafta">‹</button>
          <button class="x" data-act="week-nav" data-d="-1" aria-label="Sonraki hafta" ${off === 0 ? 'disabled' : ''}>›</button>
        </div>
      </div>
      <p class="muted small" style="margin:2px 0 10px">${fmtDate(start)} – ${fmtDate(end)}${off === 0 ? ' (bu hafta)' : ''}</p>
      <div class="stat-row three">
        <div class="stat accent"><b>${st.sessions.length}/${perWeek}</b><span>Seans</span></div>
        <div class="stat"><b>${Object.values(st.sets).reduce((a, b) => a + b, 0)}</b><span>Set</span></div>
        <div class="stat"><b>${Object.values(PROGRAM.weeklyTargets).reduce((a, b) => a + b, 0)}</b><span>Hedef set</span></div>
      </div>
      <h3 class="sub">Kas grubu başına set (yapılan / hedef)</h3>
      ${rows}
    </section>`;
}

/** Hareket listesi: programdaki her hareket, hangi seans türlerinde geçtiği. */
function progressOptions() {
  const out = [];
  Object.keys(PROGRAM.exercises).forEach((id) => {
    const slots = [];
    PROGRAM.rotation.forEach((t) => sessionDef(t).slots.forEach((sl) => { if (sl.ex === id) slots.push({ type: t, key: sl.key, reps: sl.reps }); }));
    if (slots.length) out.push({ id, slots });
  });
  return out;
}

/** Bir kaydın en iyi seti: en yüksek kilo, eşitse en çok tekrar. */
function bestSet(entry) {
  const ds = doneSets(entry);
  if (!ds.length) return null;
  return ds.reduce((a, b) => ((b.w || 0) > (a.w || 0) || ((b.w || 0) === (a.w || 0) && (b.r || 0) > (a.r || 0)) ? b : a));
}

function renderProgress() {
  const opts = progressOptions();
  const sel = opts.find((o) => o.id === ui.progEx) || opts[0];
  const ex = exDef(sel.id);
  const bw = ex.load === 'bodyweight';
  const lists = sel.slots.map((sl) => {
    const rows = state.sessions
      .filter((s) => s.type === sl.type && !s.deload)
      .map((s) => ({ s, e: s.entries.find((x) => x.slot === sl.key && !x.sub && !x.skipped) }))
      .filter((x) => x.e && bestSet(x.e))
      .map((x) => { const b = bestSet(x.e); return `<div class="hist-ex"><span>${fmtDate(x.s.finishedAt, true)}</span><span class="v"><b>${bw ? `${b.r} tekrar` : `${fmt(b.w)} kg × ${b.r}`}</b></span></div>`; });
    return `<h3 class="sub">${esc(sessionDef(sl.type).name)} · ${rangeText(sl.reps)}</h3>${rows.length ? rows.join('') : '<p class="muted small" style="margin:4px 0 0">Henüz kayıt yok.</p>'}`;
  }).join('');
  return `
    <section class="card">
      <h2>Hareket ilerlemesi</h2>
      <p class="muted small" style="margin:4px 0 10px">Her seansın en iyi seti (kilo × tekrar), eskiden yeniye. Seans türleri ayrı; yük azaltma ve yedek hareket kayıtları hariç.</p>
      <select id="progEx" class="text-in" aria-label="Hareket seç">
        ${opts.map((o) => `<option value="${o.id}" ${o.id === sel.id ? 'selected' : ''}>${esc(exDef(o.id).name)}</option>`).join('')}
      </select>
      ${lists}
    </section>`;
}

/** Son yedeğin üzerinden 14 günden fazla geçtiyse hatırlatma (hiç yedek yoksa ilk kayıttan itibaren sayılır). */
function backupDue() {
  const first = state.sessions[0];
  const ref = state.lastBackupAt || (first && first.finishedAt);
  if (!ref) return false;
  return (Date.now() - new Date(ref).getTime()) / DAY_MS > 14;
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


/* ---------------- Toast ---------------- */

let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  ui.undo = null;
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
    if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  } catch (_) {}
}

function beep() {
  try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (_) {}
  if (!audioCtx) return;
  try {
    if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
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

/** Uygulama açılınca / öne gelince: süresi çoktan (1 dk+) dolmuş sayaç sessizce kapanır. */
function resumeTimer() {
  if (!state.timer) return;
  if (state.timer.end < Date.now() - 60000) stopTimer(); else runTimer();
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
let wakeBusy = false;
async function updateWakeLock() {
  if (wakeBusy) return; // aynı anda iki istek gitmesin (fazladan kilit açık kalırdı)
  wakeBusy = true;
  try {
    const want = () => !!state.current && document.visibilityState === 'visible';
    if (want() && !wakeLock && 'wakeLock' in navigator) {
      const lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
      wakeLock = lock;
    }
    if (!want() && wakeLock) {
      const lock = wakeLock; wakeLock = null;
      await lock.release();
    }
  } catch (_) { wakeLock = null; }
  wakeBusy = false;
}

/* ---------------- Aksiyonlar ---------------- */

/** "Geri al" düğmeli bildirim. */
function toastUndo(msg, undoFn, ms = 6000) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span><button class="undo" data-act="undo">Geri al</button>`;
  t.hidden = false;
  ui.undo = undoFn;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; ui.undo = null; }, ms);
}

function clearUndo() {
  ui.undo = null;
  clearTimeout(toastTimer);
  const t = $('#toast'); if (t) t.hidden = true;
}

function setRowRefresh(i, j, force) {
  // Tek bir seti ve ilerleme çubuğunu yerinde günceller (sayfa kaymasın diye tam yenileme yapmaz)
  const sess = activeSess();
  const row = document.getElementById(`set-${i}-${j}`);
  if (!row) { render(); return; }
  const s = sess.entries[i].sets[j];
  row.classList.toggle('done', s.done);
  const card = document.getElementById(`ex-${i}`);
  if (card) card.classList.toggle('all-done', sess.entries[i].sets.every((x) => x.done));
  const wu = document.getElementById(`warm-${i}`);
  if (wu && j === 0) { const sl0 = slotDef(sess.type, sess.entries[i].slot); wu.outerHTML = warmupHtml(sl0, sess.entries[i], i); }
  const tg = document.getElementById(`tgt-${i}-${j}`);
  if (tg) tg.textContent = setTarget(sess, sess.entries[i], j);
  ['w', 'r'].forEach((f) => {
    const inp = row.querySelector(`input[data-f="${f}"]`);
    if (inp && (force || document.activeElement !== inp)) inp.value = s[f] == null ? '' : (f === 'w' ? fmt(s[f]) : s[f]);
  });
  refreshProgress();
}

function toggleSet(i, j) {
  const sess = activeSess();
  const live = !ui.editId;
  const e = sess.entries[i];
  const sl = slotDef(sess.type, e.slot);
  const ex = exDef(e.ex);
  const s = e.sets[j];
  if (s.done) {
    s.done = false;
    save();
    setRowRefresh(i, j);
    toast('Tik kaldırıldı');
    return;
  }
  if (ex.load !== 'bodyweight' && s.w == null) {
    toast('Önce ağırlığı gir');
    const inp = document.querySelector(`input[data-ex="${i}"][data-set="${j}"][data-f="w"]`);
    if (inp) inp.focus();
    return;
  }
  if (s.r === 0) { toast('Tekrar sayısını gir'); return; }
  const prevR = s.r;
  if (s.r == null) s.r = s.pr ?? sl.reps[0];
  s.done = true;
  save();
  setRowRefresh(i, j);
  const undo = () => { s.done = false; s.r = prevR; save(); if (live) stopTimer(); setRowRefresh(i, j); };
  if (!live) { toastUndo(`Set ${j + 1} kaydedildi`, undo); return; }
  const partner = supersetPartner(sess, i);
  if (partner != null && sl.ssPos === 1) {
    // Süpersetin ilk hareketi: dinlenmeden ikinciye geç
    stopTimer();
    toastUndo(`Dinlenmeden: ${sess.entries[partner].name}`, undo);
    const card = document.getElementById('ex-' + partner);
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  startTimer(sl.rest, `${e.sub ? ex.sub : ex.name}${partner != null ? ' (süperset)' : ''} · dinlenme`);
  toastUndo(`Set ${j + 1} kaydedildi`, undo);
}

/** Artı/eksi düğmesi. */
function stepValue(i, j, f, d) {
  const sess = activeSess();
  const e = sess.entries[i];
  const s = e.sets[j];
  if (f === 'w') {
    const step = weightStep(e.ex) || 1;
    const old = s.w;
    let v = (old == null ? 0 : old) + d * step;
    v = Math.max(0, Math.round(v * 100) / 100);
    s.w = v;
    // Aynı kilodaki sonraki yapılmamış setleri de güncelle
    for (let k = j + 1; k < e.sets.length; k++) if (!e.sets[k].done && e.sets[k].w === old) { e.sets[k].w = v; setRowRefresh(i, k, true); }
  } else {
    const sl = slotDef(sess.type, e.slot);
    const base = s.r == null ? (s.pr ?? sl.reps[0]) : s.r;
    s.r = Math.max(0, base + d);
  }
  save();
  setRowRefresh(i, j, true); // kutu odakta olsa bile (iPhone'da düğme odağı almaz) yeni değeri yaz
  if (f === 'w') ui.prevW = s.w;
}

function finishWorkout() {
  const cur = state.current;
  clearUndo();
  const { total, done } = countSets(cur);
  const anyDone = cur.entries.some((e) => e.sets.some((s) => s.done));
  if (!anyDone) {
    if (!confirm('Hiç set tamamlanmadı. Seans kaydedilmeden kapatılsın mı?')) return;
    state.current = null;
    ui.summary = null;
  } else {
    if (done < total && !confirm(`${total - done} set tamamlanmadı. Yine de bitirip kaydedeyim mi?`)) return;
    cur.finishedAt = new Date().toISOString();
    state.sessions.push(cur);
    state.current = null;
    ui.summary = sessionSummary(cur);
  }
  ui.inWorkout = false;
  ui.typeChoice = null;
  ui.open.clear();
  stopTimer();
  save();
  render();
  window.scrollTo(0, 0);
}

/** Süperset çiftleri birlikte hareket eder: sıradaki hareket "bloklarını" bulur. */
function entryBlocks(sess) {
  const blocks = [];
  sess.entries.forEach((e, i) => {
    const ss = (slotDef(sess.type, e.slot) || {}).ss;
    const last = blocks[blocks.length - 1];
    if (ss && last && last.ss === ss) last.idx.push(i);
    else blocks.push({ ss: ss || null, idx: [i] });
  });
  return blocks;
}

/** O günlük sıra değişikliği: 'next' = sonrakiyle yer değiştir, 'end' = sona al. Program sırası değişmez. */
function moveEntry(i, mode) {
  const sess = activeSess();
  const blocks = entryBlocks(sess);
  const b = blocks.findIndex((x) => x.idx.includes(i));
  if (b < 0) return;
  if (b === blocks.length - 1) { toast('Zaten en sonda'); return; }
  if (mode === 'next') [blocks[b], blocks[b + 1]] = [blocks[b + 1], blocks[b]];
  else blocks.push(blocks.splice(b, 1)[0]);
  const old = sess.entries;
  sess.entries = blocks.flatMap((x) => x.idx.map((k) => old[k]));
  ui.open.clear();
  save(); render();
  toast('Sıra bugün için değişti');
}

/** Bugün yedeğini yap / asıl harekete dön. Yedeğin kaydı ayrı tutulur. */
function toggleSub(i) {
  const sess = activeSess();
  const e = sess.entries[i];
  const ex = exDef(e.ex);
  if (ex.noSub) return;
  if (e.sets.some((s) => s.done) && !confirm('Bu harekette girilen setler silinecek. Devam edilsin mi?')) return;
  e.sub = !e.sub;
  e.name = e.sub ? ex.sub : ex.name;
  e.sets = prefillSets(sess.type, slotDef(sess.type, e.slot), e.sets.length, e.sub);
  ui.open.delete(`sub-${i}`);
  save(); render();
  toast(e.sub ? `Bugün yedek: ${ex.sub}` : `Asıl harekete dönüldü: ${ex.name}`);
}

/** İsteğe bağlı hareketi bugün atla / geri al. Atlanınca seans eksik sayılmaz. */
function toggleSkip(i) {
  const sess = activeSess();
  const e = sess.entries[i];
  if (!e.skipped && e.sets.some((s) => s.done) && !confirm('Bu harekette girilen setler silinecek. Atlansın mı?')) return;
  e.skipped = !e.skipped;
  if (e.skipped) e.sets.forEach((s) => { s.done = false; });
  save(); render();
}

function startEdit(id) {
  const s = state.sessions.find((x) => x.id === id);
  if (!s) return;
  clearUndo();
  ui.editId = id;
  ui.editBackup = JSON.parse(JSON.stringify(s));
  ui.open.clear();
  render();
  window.scrollTo(0, 0);
}

function endEdit(revert) {
  clearUndo();
  if (revert && ui.editBackup) {
    const i = state.sessions.findIndex((x) => x.id === ui.editId);
    if (i >= 0) state.sessions[i] = ui.editBackup;
    save();
    toast('Değişiklikler geri alındı');
  }
  ui.editId = null;
  ui.editBackup = null;
  render();
  window.scrollTo(0, 0);
}

function fileStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function saveFile(json, name) {
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'IronLog yedeği' });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

async function exportData() {
  const payload = { app: 'ironlog', version: DATA_VERSION, exportedAt: new Date().toISOString(), data: state };
  if (await saveFile(JSON.stringify(payload, null, 2), `ironlog-yedek-${fileStamp()}.json`)) {
    state.lastBackupAt = new Date().toISOString();
    save();
    toast('Yedek hazırlandı');
  }
}

function downloadPreBackup() {
  let raw = null;
  try { raw = localStorage.getItem(PRE_V3_BACKUP_KEY); } catch (_) {}
  if (!raw) { toast('Geçiş öncesi yedek bulunamadı'); return; }
  let data; try { data = JSON.parse(raw); } catch (_) { data = raw; }
  saveFile(JSON.stringify({ app: 'ironlog', version: data.version || 1, exportedAt: new Date().toISOString(), note: 'Yeni programa geçiş öncesi yedek', data }, null, 2), `ironlog-gecis-oncesi-yedek-${fileStamp()}.json`);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = parsed && parsed.data ? parsed.data : parsed;
      const next = migrate(data);
      const msg = `Yedekte ${next.sessions.length} seans, ${next.archive.length} arşiv kaydı, ${next.body.length} kilo ve ${next.waist.length} bel kaydı var.\n\nBu telefondaki mevcut veriler yedektekiyle DEĞİŞTİRİLSİN mi?`;
      if (!confirm(msg)) return;
      if (next.migration) next.migration.dismissed = true;
      next.timer = null; // yedekteki eski sayaç geri gelmesin
      state = next;
      ui.typeChoice = null; ui.summary = null; ui.inWorkout = false; ui.editId = null; ui.editBackup = null; ui.open.clear();
      stopTimer();
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
      if (ui.editId && el.dataset.tab !== 'history') { ui.editId = null; ui.editBackup = null; clearUndo(); }
      ui.tab = el.dataset.tab; render(); window.scrollTo(0, 0); break;
    case 'type':
      ui.typeChoice = el.dataset.type === nextTypeAuto() ? null : el.dataset.type; render(); break;
    case 'start': {
      if (state.current) break;
      const type = ui.typeChoice || nextTypeAuto();
      state.current = buildSession(type, state.deloadMode, ui.shortChoice);
      ui.shortChoice = false;
      ui.inWorkout = true;
      ui.summary = null;
      ui.open.clear();
      save(); render(); window.scrollTo(0, 0);
      break;
    }
    case 'check':
      if (activeSess()) toggleSet(Number(el.dataset.ex), Number(el.dataset.set)); break;
    case 'step':
      if (activeSess()) stepValue(Number(el.dataset.ex), Number(el.dataset.set), el.dataset.f, Number(el.dataset.d)); break;
    case 'undo': {
      const fn = ui.undo; ui.undo = null; $('#toast').hidden = true;
      if (fn) fn();
      break;
    }
    case 'deload':
      state.deloadMode = !state.deloadMode;
      state.deloadSince = state.deloadMode ? new Date().toISOString() : null;
      save(); render();
      toast(state.deloadMode ? 'Yük azaltma açık' : 'Yük azaltma kapalı: program kaldığı yerden devam ediyor');
      break;
    case 'bigstep': {
      const id = el.dataset.exId;
      if (!exDef(id)) break;
      state.exSettings[id] = Object.assign({ bigStep: false, note: '', step: null }, exCfg(id));
      state.exSettings[id].bigStep = !state.exSettings[id].bigStep;
      save(); render();
      break;
    }
    case 'week-nav':
      ui.weekOffset = Math.max(0, (ui.weekOffset || 0) + Number(el.dataset.d)); render(); break;
    case 'go-backup':
      ui.tab = 'settings'; render(); window.scrollTo(0, 0); break;
    case 'short':
      ui.shortChoice = !ui.shortChoice; render(); break;
    case 'move':
      moveEntry(Number(el.dataset.ex), el.dataset.mode); break;
    case 'sub':
      toggleSub(Number(el.dataset.ex)); break;
    case 'skip':
      toggleSkip(Number(el.dataset.ex)); break;
    case 'dismiss-regression':
      state.regressionDismissed = el.dataset.id; save(); render(); break;
    case 'resume':
      ui.inWorkout = true; ui.tab = 'train'; render(); window.scrollTo(0, 0); break;
    case 'close-summary':
      ui.summary = null; render(); break;
    case 'edit-session': startEdit(el.dataset.id); break;
    case 'edit-done': endEdit(false); break;
    case 'edit-revert':
      if (confirm('Bu düzenlemede yaptığın tüm değişiklikler geri alınsın mı?')) endEdit(true);
      break;
    case 'toggle': {
      const k = el.dataset.key;
      ui.open.has(k) ? ui.open.delete(k) : ui.open.add(k);
      render(); break;
    }
    case 'finish':
      if (cur) finishWorkout(); break;
    case 'cancel':
      if (cur && confirm('Seans iptal edilsin mi? Bu seansta girdiğin setler silinir.')) {
        clearUndo();
        state.current = null; ui.inWorkout = false; stopTimer(); save(); render(); window.scrollTo(0, 0);
      }
      break;
    case 't-minus': adjustTimer(-15); break;
    case 't-plus': adjustTimer(15); break;
    case 't-skip': stopTimer(); break;
    case 'del-session':
      if (confirm('Bu seans kaydı silinsin mi?')) {
        state.sessions = state.sessions.filter((s) => s.id !== el.dataset.id);
        save(); render();
      }
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
    case 'dl-pre-backup': downloadPreBackup(); break;
    case 'dismiss-migration':
      if (state.migration) { state.migration.dismissed = true; save(); render(); }
      break;
    case 'export': exportData(); break;
    case 'import': $('#importFile').click(); break;
    case 'wipe':
      if (confirm('TÜM kayıtlar (seanslar, arşiv, kilo, bel) silinsin mi? Bu işlem geri alınamaz.') && confirm('Emin misin? Önce yedek almanı öneririm.')) {
        state = defaultState(); stopTimer(); save();
        ui.typeChoice = null; ui.summary = null; ui.inWorkout = false; ui.open.clear(); render(); toast('Tüm veriler silindi');
      }
      break;
  }
});

document.addEventListener('focusin', (ev) => {
  const inp = ev.target;
  if (!inp.matches || !inp.matches('input[data-f]') || !activeSess()) return;
  const s = activeSess().entries[inp.dataset.ex].sets[inp.dataset.set];
  ui.prevW = s.w;
  // Kolay düzenleme için yazıyı seç. Sadece kutu hâlâ odaktaysa: select() odağı geri çekebilir ve
  // hızlı geçişlerde yazılan sayı önceki kutuya düşebilirdi.
  setTimeout(() => { if (document.activeElement === inp) { try { inp.select(); } catch (_) {} } }, 0);
});

document.addEventListener('input', (ev) => {
  const inp = ev.target;
  if (inp.id === 'sessNote' && activeSess()) { activeSess().note = inp.value.slice(0, 2000); save(); return; }
  if (!inp.matches('input[data-f]') || !activeSess()) return;
  const s = activeSess().entries[inp.dataset.ex].sets[inp.dataset.set];
  if (inp.dataset.f === 'w') s.w = parseNum(inp.value);
  else s.r = parseNum(inp.value, true);
  save();
});

document.addEventListener('change', (ev) => {
  const inp = ev.target;
  if (inp.dataset && inp.dataset.exnote) {
    const id = inp.dataset.exnote;
    if (!exDef(id)) return;
    state.exSettings[id] = Object.assign({ bigStep: false, note: '', step: null }, exCfg(id));
    const note = inp.value.trim().slice(0, 300);
    state.exSettings[id].note = note;
    save();
    const card = inp.closest('.ex');
    const h3 = card && card.querySelector('.ex-head h3');
    if (h3) {
      let el = card.querySelector('.machine-note');
      if (note && !el) { el = document.createElement('div'); el.className = 'machine-note'; h3.after(el); }
      if (el) { if (note) el.textContent = '⚙ ' + note; else el.remove(); }
    }
    toast('Makine ayarı notu kaydedildi');
    return;
  }
  if (inp.dataset && inp.dataset.exstep) {
    const id = inp.dataset.exstep;
    if (!exDef(id)) return;
    const raw = inp.value.trim();
    const prev = exCfg(id).step;
    let val = null;
    if (raw !== '') {
      val = parseNum(raw);
      if (val == null || !Number.isFinite(val) || val < 0.25 || val > 50) {
        inp.value = prev ? fmt(prev) : '';
        toast('Adım 0,25 ile 50 kg arasında olmalı');
        return;
      }
    }
    state.exSettings[id] = Object.assign({ bigStep: false, note: '', step: null }, exCfg(id));
    state.exSettings[id].step = val;
    save();
    inp.value = val ? fmt(val) : '';
    const card = inp.closest('.ex');
    if (card) {
      const sm = card.querySelector('.set2-head small');
      if (sm) sm.textContent = `(±${fmt(weightStep(id))})`;
      const i = Number(card.id.replace('ex-', ''));
      const sess = activeSess();
      const wu = document.getElementById(`warm-${i}`);
      if (wu && sess && sess.entries[i]) wu.outerHTML = warmupHtml(slotDef(sess.type, sess.entries[i].slot), sess.entries[i], i);
    }
    toast('Ağırlık adımı kaydedildi');
    return;
  }
  if (inp.id === 'progEx') { ui.progEx = inp.value; render(); return; }
  if (inp.id === 'importFile') {
    if (inp.files && inp.files[0]) importData(inp.files[0]);
    inp.value = '';
    return;
  }
  if (!inp.matches('input[data-f]') || !activeSess()) return;
  const i = Number(inp.dataset.ex), j = Number(inp.dataset.set);
  const e = activeSess().entries[i];
  if (inp.dataset.f === 'w') {
    // Ağırlığı değiştirince, aynı ağırlıktaki sonraki yapılmamış setleri de güncelle
    const oldW = ui.prevW, newW = e.sets[j].w;
    if (newW != null && newW !== oldW) {
      for (let k = j + 1; k < e.sets.length; k++) {
        const s = e.sets[k];
        if (!s.done && s.w === oldW) {
          s.w = newW;
          setRowRefresh(i, k);
        }
      }
      save();
    }
    ui.prevW = newW;
  }
  refreshProgress();
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
  if (document.visibilityState === 'visible') { resumeTimer(); checkForUpdate(); }
  updateWakeLock();
});

setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && activeSess() && !ui.editId) el.textContent = elapsedText(activeSess());
}, 20000);

// Ana ekrandan açılan uygulama günlerce bellekte kalabilir: öne geldikçe yeni sürüm var mı diye bak
let swReg = null;
let lastUpdateCheck = Date.now();
function checkForUpdate() {
  if (!swReg || Date.now() - lastUpdateCheck < 3600000) return;
  lastUpdateCheck = Date.now();
  swReg.update().catch(() => {});
}

/* ---------------- Başlat ---------------- */

// Güncelleme sırasında sayfa kendini yenilediyse seans ekranına geri dön
try {
  if (sessionStorage.getItem('ironlog.resume') === '1') { sessionStorage.removeItem('ironlog.resume'); if (state.current) ui.inWorkout = true; }
} catch (_) {}
render();
resumeTimer();

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
      try { if (state.current && ui.inWorkout) sessionStorage.setItem('ironlog.resume', '1'); } catch (_) {}
      window.location.reload();
    });
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((r) => { swReg = r; }).catch(() => {});
  });
}
