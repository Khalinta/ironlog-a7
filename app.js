'use strict';

/* =========================================================
   IronLog – sade, çevrimdışı çalışan antrenman kayıt uygulaması
   Program tanımı program.js dosyasındadır (PROGRAM nesnesi).
   ========================================================= */

const STORAGE_KEY = 'ironlog.v1';            // Anahtar değişmez: eski kayıtlar aynı yerden okunur
const PRE_V3_BACKUP_KEY = 'ironlog.backup.pre-v3';
const DATA_VERSION = 3;
const APP_VERSION = '4.0.0';
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
const sessionDef = (type) => PROGRAM.sessions[type];
const exDef = (id) => PROGRAM.exercises[id];
const slotDef = (type, key) => (sessionDef(type) ? sessionDef(type).slots.find((s) => s.key === key) : null);

/** Bir setin zorluk hedefi ("1–2 kala", "2 kala", "tükeniş"). */
function effortFor(slot, j, n) {
  const L = PROGRAM.effortLabels;
  if (slot.effort === 'rir2') return L.rir2;
  if (slot.effort === 'lastFail') return j === n - 1 ? L.fail : L.rir12;
  return L.rir12;
}

const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------------- Durum (localStorage) ---------------- */

function defaultState() {
  return { version: DATA_VERSION, sessions: [], archive: [], current: null, timer: null, body: [], waist: [], migration: null };
}

function normSet(s) {
  if (!s || typeof s !== 'object') return null;
  return { w: parseNum(s.w), r: parseNum(s.r, true), pr: parseNum(s.pr, true), done: !!s.done };
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
    day: typeof s.day === 'string' ? s.day : '?',
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
    st.migration = raw.migration && typeof raw.migration === 'object' ? raw.migration : null;
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
function lastSlotEntry(type, slotKey, beforeId) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (s.type !== type || s.id === beforeId) continue;
    const e = s.entries.find((x) => x.slot === slotKey);
    if (e && doneSets(e).length) return { session: s, entry: e };
  }
  return null;
}

/* ---------------- Seans başlatma ---------------- */

function buildSession(type) {
  const def = sessionDef(type);
  const entries = def.slots.map((sl) => {
    const ex = exDef(sl.ex);
    const ref = lastSlotEntry(type, sl.key);
    const refSets = ref ? doneSets(ref.entry) : [];
    const sets = [];
    for (let j = 0; j < sl.sets; j++) {
      const rs = refSets[j] || refSets[refSets.length - 1] || null;
      const w = ex.load !== 'bodyweight' && rs && rs.w != null ? rs.w : null;
      const pr = rs && rs.r != null ? rs.r : sl.reps[0];
      sets.push({ w, r: null, pr, done: false });
    }
    return { slot: sl.key, ex: sl.ex, name: ex.name, sets };
  });
  return { id: uid(), type, name: def.name, startedAt: new Date().toISOString(), finishedAt: null, entries };
}

/* ---------------- Arayüz durumu ---------------- */

const ui = {
  tab: 'train',
  typeChoice: null,     // Ana ekranda elle seçilen seans (null = otomatik sıra)
  open: new Set(),      // Açık kutular
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

function effortSummary(sl) {
  if (sl.effort === 'lastFail') return 'son set tükeniş';
  return PROGRAM.effortLabels[sl.effort === 'rir2' ? 'rir2' : 'rir12'];
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

    <section class="card hero">
      <div class="eyebrow">Sıradaki seans</div>
      <div class="hero-row">
        <div class="hero-day">${esc(def.name.split(' ')[1] || '')}</div>
        <div class="hero-info">
          <div class="hero-title">${esc(def.name)}</div>
          <div class="muted small">${def.slots.length} hareket</div>
        </div>
      </div>
      <div class="seg seg4">${typeBtns}</div>
      <div class="muted small" style="margin-top:12px">
        ${last ? `Son seans: ${esc(last.name)}, ${fmtDate(last.finishedAt, true)}. ` : 'Yeni programda henüz kayıtlı seans yok. '}
        Otomatik sıra: <b>${esc(sessionDef(auto).name)}</b>${ui.typeChoice && ui.typeChoice !== auto ? ' (elle değiştirdin)' : ''}
      </div>
    </section>

    <section class="card">
      <h2>${esc(def.name)} planı</h2>
      <p class="muted small" style="margin:4px 0 0">${esc(def.about)}</p>
      <ul class="plan-list">${items}</ul>
    </section>

    ${renderRules()}

    <div class="sticky-cta">
      <button class="btn primary" data-act="start">${esc(def.name)} seansına başla</button>
    </div>`;
}

function countSets(cur) {
  let total = 0, done = 0;
  cur.entries.forEach((e) => {
    const sl = slotDef(cur.type, e.slot);
    e.sets.forEach((s) => { if (!(sl && sl.optional)) total++; if (s.done && !(sl && sl.optional)) done++; });
  });
  return { total, done };
}

function elapsedText(cur) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(cur.startedAt).getTime()) / 60000));
  return `${min} dk`;
}

function renderWorkout() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  return `
    <div class="wk-head">
      <div>
        <div class="eyebrow">Seans</div>
        <div class="title">${esc(cur.name)}</div>
      </div>
      <div class="prog"><b id="prog">${done}/${total}</b><span>set</span></div>
    </div>
    <div class="progress"><div id="progbar" style="width:${total ? (done / total) * 100 : 0}%"></div></div>
    <div class="wk-meta"><span>⏱ <span id="elapsed">${elapsedText(cur)}</span></span></div>

    ${cur.entries.map((e, i) => renderExercise(cur, e, i)).join('')}

    <button class="btn good" data-act="finish" style="margin-top:6px">Seansı bitir ve kaydet</button>
    <button class="btn danger" data-act="cancel">Seansı iptal et</button>`;
}

function supersetPartner(cur, i) {
  const sl = slotDef(cur.type, cur.entries[i].slot);
  if (!sl || !sl.ss) return null;
  const j = cur.entries.findIndex((x, k) => k !== i && (slotDef(cur.type, x.slot) || {}).ss === sl.ss);
  return j >= 0 ? j : null;
}

function renderForm(ex) {
  return ex.form.map((f) => {
    const label = f.label ? `<b>${esc(f.label)}:</b> ` : '';
    const steps = f.steps && f.steps.length ? `<ol>${f.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    return `<div class="form-part">${label}${esc(f.text)}${steps}</div>`;
  }).join('');
}

function renderExercise(cur, e, i) {
  const sl = slotDef(cur.type, e.slot);
  const ex = exDef(e.ex);
  if (!sl || !ex) return '';
  const n = e.sets.length;
  const bodyweight = ex.load === 'bodyweight';

  const ref = lastSlotEntry(cur.type, sl.key, cur.id);
  let lastHtml = '';
  if (ref) {
    const ds = doneSets(ref.entry);
    const vals = bodyweight ? ds.map((s) => `${fmt(s.r)}`).join(' · ') : ds.map((s) => `${fmt(s.w)}×${fmt(s.r)}`).join(' · ');
    lastHtml = `<div class="last">Son ${esc(cur.name)}: <b>${vals}</b> <span>(${fmtDate(ref.session.finishedAt)})</span></div>`;
  } else {
    lastHtml = `<div class="last">Bu seansta henüz kaydı yok.</div>`;
  }

  let notes = '';
  if (sl.warmup) notes += `<div class="note blue"><b>Isınma (kaydedilmez):</b> ${esc(sl.warmup.text)}</div>`;
  if (sl.effortNote) notes += `<div class="note blue">${esc(sl.effortNote)}</div>`;
  if (sl.note) notes += `<div class="note blue">${esc(sl.note)}</div>`;

  const partner = supersetPartner(cur, i);
  let restText = sl.restNote ? esc(sl.restNote) : `${fmtRest(sl.rest)} dinlenme`;
  if (partner != null && sl.ssPos === 1) restText = `ardından dinlenmeden ${esc(exDef(cur.entries[partner].ex).name)}`;
  if (partner != null && sl.ssPos === 2) restText = `tur bitince ${fmtRest(sl.rest)} dinlenme`;
  const tags = [
    partner != null ? `<span class="tag ss-tag">Süperset ${sl.ssPos}/2</span>` : '',
    sl.optional ? '<span class="tag">İsteğe bağlı</span>' : '',
    ex.perSide ? '<span class="tag">Her kol</span>' : '',
  ].join('');

  const sets = e.sets.map((s, j) => `
    <div class="set ${s.done ? 'done' : ''} ${bodyweight ? 'noweight' : ''}">
      <span class="n">${j + 1}<small class="eff ${effortFor(sl, j, n) === PROGRAM.effortLabels.fail ? 'fail' : ''}">${esc(effortFor(sl, j, n))}</small></span>
      ${bodyweight ? '' : `<label class="fld"><input data-ex="${i}" data-set="${j}" data-f="w" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${s.w == null ? '' : fmt(s.w)}" placeholder="–" aria-label="Set ${j + 1} ağırlık"></label>`}
      <label class="fld"><input data-ex="${i}" data-set="${j}" data-f="r" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" value="${s.r == null ? '' : s.r}" placeholder="${s.pr ?? sl.reps[0]}" aria-label="Set ${j + 1} tekrar"></label>
      <button class="chk" data-act="check" data-ex="${i}" data-set="${j}" aria-label="Set ${j + 1} tamam">${CHECK_SVG}</button>
    </div>`).join('');

  const formKey = `form-${i}`, subKey = `sub-${i}`;
  const toggles = [
    `<button data-act="toggle" data-key="${formKey}" class="${ui.open.has(formKey) ? 'on' : ''}">Form</button>`,
    ex.sub ? `<button data-act="toggle" data-key="${subKey}" class="${ui.open.has(subKey) ? 'on' : ''}">Alet doluysa</button>` : '',
  ].filter(Boolean);
  const allDone = n && e.sets.every((s) => s.done);
  return `
    <article class="card ex ${allDone ? 'all-done' : ''} ${partner != null ? 'in-ss ss' + sl.ssPos : ''}" id="ex-${i}">
      <div class="ex-head">
        <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="grow">
          <div class="ex-tags"><span class="kind">${esc(ex.muscle)}</span>${tags}</div>
          <h3>${esc(ex.name)}</h3>
        </div>
      </div>
      <div class="ex-meta">${n} set × ${rangeText(sl.reps)} tekrar${ex.perSide ? ' (her kol)' : ''} · ${restText}</div>
      ${lastHtml}
      ${notes}
      <div class="sets">
        <div class="set-head ${bodyweight ? 'noweight' : ''}"><span>Hedef</span>${bodyweight ? '' : '<span>kg</span>'}<span>${ex.perSide ? 'tekrar / kol' : 'tekrar'}</span><span></span></div>
        ${sets}
      </div>
      <div class="toggles" style="grid-template-columns:repeat(${toggles.length},1fr)">${toggles.join('')}</div>
      ${ui.open.has(formKey) ? `<div class="infobox"><strong>Form</strong>${renderForm(ex)}</div>` : ''}
      ${ui.open.has(subKey) ? `<div class="infobox"><strong>Alet doluysa</strong><p>Önce sırayı değiştir: bir sonraki hareketi yapıp geri dön. Alet uzun süre boşalmayacaksa o günlük yedeği kullan; set, tekrar ve zorluk aynı kalır.</p><p><b>Yedek:</b> ${esc(ex.sub)}</p></div>` : ''}
    </article>`;
}

function refreshProgress() {
  const cur = state.current;
  if (!cur) return;
  const { total, done } = countSets(cur);
  const p = $('#prog'); if (p) p.textContent = `${done}/${total}`;
  const b = $('#progbar'); if (b) b.style.width = `${total ? (done / total) * 100 : 0}%`;
}

function renderHistory() {
  const list = [...state.sessions].reverse().map((s) => {
    const rows = s.entries.map((e) => {
      const ds = doneSets(e);
      const bw = exDef(e.ex) && exDef(e.ex).load === 'bodyweight';
      const v = ds.length ? ds.map((x) => (bw ? `${fmt(x.r)}` : `${fmt(x.w)}×${fmt(x.r)}`)).join(' · ') : 'yapılmadı';
      return `<div class="hist-ex"><span>${esc(e.name)}</span><span class="v">${v}</span></div>`;
    }).join('');
    return `
      <section class="card">
        <div class="row-between">
          <div class="hist-day">${esc(s.name)}</div>
          <div class="muted small">${fmtDate(s.finishedAt, true)}</div>
        </div>
        ${rows}
        <button class="btn danger hist-del" data-act="del-session" data-id="${esc(s.id)}">Bu kaydı sil</button>
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
`;
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
  const e = cur.entries[i];
  const sl = slotDef(cur.type, e.slot);
  const ex = exDef(e.ex);
  const s = e.sets[j];
  if (s.done) {
    s.done = false;
    save();
    render();
    return;
  }
  if (ex.load !== 'bodyweight' && s.w == null) {
    toast('Önce ağırlığı gir');
    const inp = document.querySelector(`input[data-ex="${i}"][data-set="${j}"][data-f="w"]`);
    if (inp) inp.focus();
    return;
  }
  if (s.r == null) s.r = s.pr ?? sl.reps[0];
  s.done = true;
  save();
  const partner = supersetPartner(cur, i);
  if (partner != null && sl.ssPos === 1) {
    // Süpersetin ilk hareketi: dinlenmeden ikinciye geç
    stopTimer();
    render();
    toast(`Dinlenmeden: ${exDef(cur.entries[partner].ex).name}`);
    const card = document.getElementById('ex-' + partner);
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  startTimer(sl.rest, `${ex.name}${partner != null ? ' (süperset)' : ''} · dinlenme`);
  render();
}

function finishWorkout() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  const anyDone = cur.entries.some((e) => e.sets.some((s) => s.done));
  if (!anyDone) {
    if (!confirm('Hiç set tamamlanmadı. Seans kaydedilmeden kapatılsın mı?')) return;
    state.current = null;
  } else {
    if (done < total && !confirm(`${total - done} set tamamlanmadı. Yine de bitirip kaydedeyim mi?`)) return;
    cur.finishedAt = new Date().toISOString();
    state.sessions.push(cur);
    state.current = null;
    toast(`Kaydedildi 💪 Sıradaki: ${sessionDef(nextTypeAuto()).name}`, 3500);
  }
  ui.typeChoice = null;
  ui.open.clear();
  stopTimer();
  save();
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
      state = next;
      save();
      ui.typeChoice = null;
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
    case 'type':
      ui.typeChoice = el.dataset.type === nextTypeAuto() ? null : el.dataset.type; render(); break;
    case 'start': {
      const type = ui.typeChoice || nextTypeAuto();
      state.current = buildSession(type);
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
    case 'finish':
      if (cur) finishWorkout(); break;
    case 'cancel':
      if (cur && confirm('Seans iptal edilsin mi? Bu seansta girdiğin setler silinir.')) {
        state.current = null; stopTimer(); save(); render(); window.scrollTo(0, 0);
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
        state = defaultState(); stopTimer(); save(); ui.typeChoice = null; render(); toast('Tüm veriler silindi');
      }
      break;
  }
});

document.addEventListener('focusin', (ev) => {
  const inp = ev.target;
  if (!inp.matches || !inp.matches('input[data-f]') || !state.current) return;
  const s = state.current.entries[inp.dataset.ex].sets[inp.dataset.set];
  ui.prevW = s.w;
  setTimeout(() => { try { inp.select(); } catch (_) {} }, 0);
});

document.addEventListener('input', (ev) => {
  const inp = ev.target;
  if (!inp.matches('input[data-f]') || !state.current) return;
  const s = state.current.entries[inp.dataset.ex].sets[inp.dataset.set];
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
  const e = state.current.entries[i];
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
  if (document.visibilityState === 'visible' && state.timer) runTimer();
  updateWakeLock();
});

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
