'use strict';

/* =========================================================
   IronLog – sade, çevrimdışı çalışan gym takip uygulaması
   ========================================================= */

const STORAGE_KEY = 'ironlog.v1';
const APP_VERSION = '1.1.0';
const BIG_COUNT = 3;        // Her günün ilk 3 hareketi "büyük" hareket
const WARMUP_MIN = 5;

const WEEKS = {
  1: { big: 2, small: 1, cardio: 10, deload: false, rir: '3–4' },
  2: { big: 2, small: 2, cardio: 12, deload: false, rir: '3' },
  3: { big: 3, small: 2, cardio: 15, deload: false, rir: '2–3' },
  4: { big: 2, small: 1, cardio: 15, deload: true, rir: '4', cardioNote: 'rahat tempo' },
  5: { big: 3, small: 2, cardio: 15, deload: false, rir: '2' },
  6: { big: 3, small: 2, cardio: 18, deload: false, rir: '2' },
  7: { big: 3, small: 2, cardio: 20, deload: false, rir: '1–2' },
  8: { big: 2, small: 1, cardio: 15, deload: true, rir: '4', cardioNote: 'rahat tempo' },
};

const EX = {
  legpress: {
    name: 'Leg press', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Ayaklarını platformda biraz yüksek koy ve belin koltuktan kalkmadan inebildiğin yerde dur.',
    alt: 'Yerde glute bridge',
  },
  chestpress: {
    name: 'Göğüs press makinesi', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Kürek kemiklerini geriye yasla ve kollarını tam kilitlemeden it.',
    alt: 'Pec deck makinesi',
  },
  seatedrow: {
    name: 'Oturarak row makinesi', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Gövdeni sallamadan dirseklerini geriye çek.',
    alt: 'Göğüs destekli row makinesi',
  },
  lateral: {
    name: 'Dumbbell lateral raise', reps: [12, 15], rest: 60, weighted: true,
    tip: 'Hafif dumbbell seç, dirseklerini omuz hizasına kadar kaldır ve yavaş indir.',
    alt: 'Lateral raise makinesi',
  },
  preacher: {
    name: 'Tek kol dumbbell preacher curl', reps: [12, 15], rest: 60, weighted: true, perSide: 'her kol',
    tip: 'Kolunu sehpaya yasla, ağırlığı yavaş indir ve en altta dirseğini kilitleme.',
    alt: 'Oturarak dumbbell curl (sehpa doluysa da bunu yap)',
  },
  legcurl: {
    name: 'Oturarak leg curl', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Kalçanı koltuktan kaldırmadan topuklarını alta çek.',
    alt: 'Yerde glute bridge',
  },
  latpulldown: {
    name: 'Lat pulldown', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Tutamağı göğüsünün üstüne çek, gövdeni geriye savurma.',
    alt: 'Kablolu düz kol pulldown',
  },
  shoulderpress: {
    name: 'Omuz press makinesi', reps: [10, 12], rest: 90, weighted: true,
    tip: 'Sırtını pedde tut ve belini kavisleyerek itme.',
    alt: 'Daha hafif ağırlık ve daha dar hareket aralığı',
  },
  abduction: {
    name: 'Hip abduction makinesi', reps: [12, 15], rest: 60, weighted: true,
    tip: 'Sırtını sabit tut ve bacaklarını kontrollü açıp kapat.',
    alt: 'Yan yatarak bacak açma',
  },
  deadbug: {
    name: 'Dead bug', reps: [8, 8], rest: 60, weighted: false, perSide: 'her yön',
    tip: 'Belini yere bastırırken karşı kol ve bacağı yavaşça uzat.',
    alt: 'Sırtüstü dizler büklü, sırayla ayak dokundurma',
  },
};

const DAYS = {
  A: ['legpress', 'chestpress', 'seatedrow', 'lateral', 'preacher'],
  B: ['legcurl', 'latpulldown', 'shoulderpress', 'abduction', 'deadbug', 'preacher'],
};

const WARMUP_TIP = 'Bisiklet veya eliptikte rahat tempo.';
const PREP_SET_NOTE = 'Hazırlık seti: Bu hareketten önce çok hafif ağırlıkla 1 set, 12 tekrar.';
const PREP_SET_COUNT = 2; // Günün ilk iki hareketi
const CARDIO_TIP = 'Ağırlıklardan sonra bisiklet veya eliptik. Tempo ölçüsü: Cümle kurabilmeli ama şarkı söyleyememelisin. Seans 60 dakikayı aşacaksa kardiyoyu kısalt.';
const RIR_INFO = '"Kalan tekrar", set bittiğinde temiz formla kaç tekrar daha yapabileceğini gösterir.';
const ALT_NOTE = 'Keskin veya batan bir ağrı olursa o hareketi bırak ve alternatifine geç. Kas yorgunluğu normaldir; eklem ağrısı değil.';
const DELOAD_NOTE = 'Yük azaltma haftası: Bu hafta ağırlıkları yaklaşık %20 düşür.';
const AFTER_W8_NOTE = '8. haftadan sonra 7. haftanın ağırlıklarıyla 5. haftadan yeni bir döngü başlat.';

/* ---------------- Yardımcılar ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null ? '–' : String(Math.round(n * 100) / 100).replace('.', ','));
const repRange = (ex) => (ex.reps[0] === ex.reps[1] ? String(ex.reps[0]) : `${ex.reps[0]}-${ex.reps[1]}`);
const isBig = (day, idx) => idx < BIG_COUNT;
const setsFor = (week, day, idx) => (isBig(day, idx) ? WEEKS[week].big : WEEKS[week].small);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function parseNum(v, int) {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = int ? parseInt(s, 10) : parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 2000) return null;
  return int ? n : Math.round(n * 100) / 100;
}

function fmtDate(iso, withWeekday) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const opts = { day: 'numeric', month: 'short' };
  if (withWeekday) opts.weekday = 'short';
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('tr-TR', opts);
}

const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------------- Durum (localStorage) ---------------- */

function defaultState() {
  return { version: 1, week: 1, sessions: [], current: null, timer: null };
}

function normSet(s) {
  if (!s || typeof s !== 'object') return null;
  return {
    w: parseNum(s.w),
    r: parseNum(s.r, true),
    pr: parseNum(s.pr, true),
    done: !!s.done,
  };
}

function normSession(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.day !== 'A' && s.day !== 'B') return null;
  const week = WEEKS[s.week] ? Number(s.week) : 1;
  const exercises = Array.isArray(s.exercises)
    ? s.exercises
        .filter((e) => e && EX[e.id] && Array.isArray(e.sets))
        .map((e) => ({ id: e.id, sets: e.sets.map(normSet).filter(Boolean) }))
    : [];
  return {
    id: typeof s.id === 'string' ? s.id : uid(),
    day: s.day,
    week,
    deload: WEEKS[week].deload,
    startedAt: typeof s.startedAt === 'string' ? s.startedAt : new Date().toISOString(),
    finishedAt: typeof s.finishedAt === 'string' ? s.finishedAt : null,
    warmupDone: !!s.warmupDone,
    cardioDone: !!s.cardioDone,
    cardioMin: parseNum(s.cardioMin, true) || WEEKS[week].cardio,
    exercises,
  };
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz veri');
  if (!Array.isArray(raw.sessions)) throw new Error('Yedekte antrenman listesi yok');
  const st = defaultState();
  st.week = WEEKS[raw.week] ? Number(raw.week) : 1;
  st.sessions = raw.sessions.map(normSession).filter((s) => s && s.finishedAt);
  st.sessions.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  st.current = raw.current ? normSession(raw.current) : null;
  if (st.current) st.current.finishedAt = null;
  if (raw.timer && typeof raw.timer === 'object' && Number.isFinite(raw.timer.end)) {
    st.timer = { end: raw.timer.end, total: Number(raw.timer.total) || 60, label: String(raw.timer.label || '') };
  }
  return st;
}

function load() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return defaultState(); }
  if (!raw) return defaultState();
  try {
    return normalize(JSON.parse(raw));
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

/** En son yapılan (tamamlanmış set içeren) kayıt. opts.nonDeload: yük azaltma haftalarını atla */
function lastEntry(exId, opts = {}) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    if (opts.nonDeload && s.deload) continue;
    if (opts.week && s.week !== opts.week) continue;
    const e = s.exercises.find((x) => x.id === exId);
    if (e && doneSets(e).length) return { session: s, entry: e };
  }
  return null;
}

function topReached(exId, entry) {
  const ex = EX[exId];
  if (!ex.weighted || !entry || !entry.sets.length) return false;
  return entry.sets.every((s) => s.done && s.r != null && s.r >= ex.reps[1]);
}

/* ---------------- Antrenman başlatma ---------------- */

function buildSession(day, week) {
  const deload = WEEKS[week].deload;
  const exercises = DAYS[day].map((id, idx) => {
    const ex = EX[id];
    const n = setsFor(week, day, idx);
    // Ağırlık önerisi: normalde son normal hafta (yük azaltma sonrası 3./7. haftanın ağırlıkları).
    // Yük azaltma haftasında, aynı hafta önceden girilmiş (düşürülmüş) ağırlık varsa o; yoksa son normal hafta.
    // Ağırlıklar otomatik düşürülmez, sadece hatırlatma gösterilir.
    const ref = (deload && lastEntry(id, { week })) || lastEntry(id, { nonDeload: true }) || lastEntry(id);
    const bump = !deload && ref && !ref.session.deload && topReached(id, ref.entry);
    const refSets = ref ? doneSets(ref.entry) : [];
    const sets = [];
    for (let j = 0; j < n; j++) {
      const rs = refSets[j] || refSets[refSets.length - 1] || null;
      let w = null;
      if (ex.weighted && rs && rs.w != null) w = rs.w;
      // Ağırlık artırılacaksa tekrar aralığının altından başla
      const pr = !bump && rs && rs.r != null ? rs.r : ex.reps[0];
      sets.push({ w, r: null, pr, done: false });
    }
    return { id, sets };
  });
  return {
    id: uid(), day, week, deload,
    startedAt: new Date().toISOString(), finishedAt: null,
    warmupDone: false, cardioDone: false, cardioMin: WEEKS[week].cardio,
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
  else if (ui.tab === 'settings') app.innerHTML = renderSettings();
  else app.innerHTML = state.current ? renderWorkout() : renderHome();
  updateWakeLock();
}

function renderHome() {
  const auto = nextDayAuto();
  const day = ui.dayChoice || auto;
  const w = WEEKS[state.week];
  const last = state.sessions[state.sessions.length - 1];

  const weekBtns = Object.keys(WEEKS).map((k) => `
    <button data-act="week" data-week="${k}" class="${Number(k) === state.week ? 'on' : ''}" aria-label="Hafta ${k}${WEEKS[k].deload ? ', yük azaltma' : ''}">
      ${k}${WEEKS[k].deload ? '<span class="dl">↓</span>' : ''}
    </button>`).join('');

  const items = DAYS[day].map((id, idx) => {
    const ex = EX[id];
    return `<li><span>${esc(ex.name)}</span><span class="meta">${setsFor(state.week, day, idx)} × ${repRange(ex)}${ex.perSide ? ' ' + ex.perSide : ''}</span></li>`;
  }).join('');

  return `
    <h1 class="page-title">IronLog</h1>
    <section class="card">
      <div class="muted">Sıradaki antrenman</div>
      <div class="seg">
        <button data-act="day" data-day="A" class="${day === 'A' ? 'on' : ''}">A günü</button>
        <button data-act="day" data-day="B" class="${day === 'B' ? 'on' : ''}">B günü</button>
      </div>
      <div class="muted small" style="margin-top:10px">
        ${last ? `Son antrenman: ${last.day} günü, ${fmtDate(last.finishedAt, true)}. ` : 'Henüz kayıtlı antrenman yok. '}
        Otomatik sıra: <b>${auto}</b>${ui.dayChoice && ui.dayChoice !== auto ? ' (elle değiştirdin)' : ''}
      </div>
    </section>

    <section class="card">
      <div class="row-between"><h2>Hafta ${state.week}</h2>
        ${w.deload ? '<span class="tag">Yük azaltma</span>' : ''}</div>
      <div class="muted small" style="margin-top:4px">Büyük hareket ${w.big} set · küçük hareket ${w.small} set · kalan tekrar ${w.rir} · kardiyo ${w.cardio} dk${w.cardioNote ? ', ' + w.cardioNote : ''}</div>
      <div class="weeks">${weekBtns}</div>
      <div class="note warn">Kalan tekrar: ${w.rir}. <span style="font-weight:450">${esc(RIR_INFO)}</span></div>
      ${w.deload ? `<div class="note blue">${DELOAD_NOTE}</div>` : ''}
      ${state.week === 8 ? `<div class="note blue">${AFTER_W8_NOTE}</div>` : ''}
    </section>

    <section class="card">
      <h2>${day} günü planı</h2>
      <ul class="plan-list">
        <li><span>Isınma</span><span class="meta">${WARMUP_MIN} dk</span></li>
        ${items}
        <li><span>Kardiyo</span><span class="meta">${w.cardio} dk${w.cardioNote ? ', ' + w.cardioNote : ''}</span></li>
      </ul>
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

function renderWorkout() {
  const cur = state.current;
  const { total, done } = countSets(cur);
  const exHtml = cur.exercises.map((e, i) => renderExercise(cur, e, i)).join('');
  return `
    <div class="wk-head">
      <div>
        <div class="title">${cur.day} günü</div>
        <div class="muted small">Hafta ${cur.week} ${cur.deload ? '<span class="tag">Yük azaltma</span>' : ''}</div>
      </div>
      <div class="prog" id="prog">${done}/${total} set</div>
    </div>
    <div class="progress"><div id="progbar" style="width:${total ? (done / total) * 100 : 0}%"></div></div>
    <div class="note warn" style="margin:0 0 12px">Kalan tekrar: ${WEEKS[cur.week].rir}. <span style="font-weight:450">${esc(RIR_INFO)}</span></div>

    ${renderStep('warmup', 'Isınma', `${WARMUP_MIN} dk`, cur.warmupDone, WARMUP_TIP)}
    ${exHtml}
    ${renderStep('cardio', 'Kardiyo', `${cur.cardioMin} dk${WEEKS[cur.week].cardioNote ? ', ' + WEEKS[cur.week].cardioNote : ''}`, cur.cardioDone, CARDIO_TIP)}

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

function renderExercise(cur, e, i) {
  const ex = EX[e.id];
  const ref = lastEntry(e.id);
  const refNormal = lastEntry(e.id, { nonDeload: true });

  let lastHtml = ex.weighted
    ? '<div class="last">Başlangıç ağırlığı: Set bittiğinde 3–4 tekrar daha yapabileceğin ağırlığı seç.</div>'
    : '';
  if (ref) {
    const ds = doneSets(ref.entry);
    const vals = ex.weighted
      ? ds.map((s) => `${fmt(s.w)} kg × ${fmt(s.r)}`).join(' · ')
      : ds.map((s) => `${fmt(s.r)} tekrar`).join(' · ');
    lastHtml = `<div class="last">Son: <b>${vals}</b> <span>(${fmtDate(ref.session.finishedAt)}${ref.session.deload ? ', yük azaltma' : ''})</span></div>`;
  }

  let notes = '';
  if (i < PREP_SET_COUNT) notes += `<div class="note blue">${PREP_SET_NOTE}</div>`;
  if (!ex.weighted) notes += '<div class="note blue">Ağırlık ekleme; hareketi kontrollü yapmaya odaklan.</div>';
  if (!cur.deload && refNormal && topReached(e.id, refNormal.entry)) {
    const maxW = Math.max(...doneSets(refNormal.entry).map((s) => s.w || 0));
    notes += `<div class="note warn">⬆ Geçen sefer (${fmt(maxW)} kg) tüm setlerde ${ex.reps[1]} tekrara ulaştın: bugün makinedeki veya dumbbell'daki en küçük adım kadar ağırlık ekle ve ${ex.reps[0]} tekrardan başla.</div>`;
  }
  if (cur.deload && ex.weighted) notes += `<div class="note blue">${DELOAD_NOTE}</div>`;

  const sets = e.sets.map((s, j) => `
    <div class="set ${s.done ? 'done' : ''} ${ex.weighted ? '' : 'noweight'}">
      <span class="n">${j + 1}</span>
      ${ex.weighted ? `<label class="fld"><input data-ex="${i}" data-set="${j}" data-f="w" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${s.w == null ? '' : fmt(s.w)}" placeholder="–" aria-label="Set ${j + 1} ağırlık"></label>` : ''}
      <label class="fld"><input data-ex="${i}" data-set="${j}" data-f="r" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" value="${s.r == null ? '' : s.r}" placeholder="${s.pr ?? ex.reps[0]}" aria-label="Set ${j + 1} tekrar"></label>
      <button class="chk" data-act="check" data-ex="${i}" data-set="${j}" aria-label="Set ${j + 1} tamam">${CHECK_SVG}</button>
    </div>`).join('');

  const tipKey = `tip-${i}`, altKey = `alt-${i}`;
  const allDone = e.sets.length && e.sets.every((s) => s.done);
  return `
    <article class="card ex ${allDone ? 'all-done' : ''}" id="ex-${i}">
      <div class="ex-head"><h3>${esc(ex.name)}</h3></div>
      <div class="ex-meta">${e.sets.length} set × ${repRange(ex)} tekrar${ex.perSide ? ' (' + ex.perSide + ')' : ''} · ${ex.rest} sn dinlenme</div>
      ${lastHtml}
      ${notes}
      <div class="sets">
        <div class="set-head ${ex.weighted ? '' : 'noweight'}"><span></span>${ex.weighted ? '<span>kg</span>' : ''}<span>${ex.perSide === 'her yön' ? 'tekrar / yön' : 'tekrar'}</span><span></span></div>
        ${sets}
      </div>
      <div class="ex-live" id="live-${i}">${renderLive(cur, i)}</div>
      <div class="toggles">
        <button data-act="toggle" data-key="${tipKey}" class="${ui.open.has(tipKey) ? 'on' : ''}">Form ipucu</button>
        <button data-act="toggle" data-key="${altKey}" class="${ui.open.has(altKey) ? 'on' : ''}">Alternatif</button>
      </div>
      ${ui.open.has(tipKey) ? `<div class="infobox"><strong>Form ipucu</strong>${esc(ex.tip)}</div>` : ''}
      ${ui.open.has(altKey) ? `<div class="infobox"><strong>Daha kolay alternatif</strong>${esc(ex.alt)}<div class="muted small" style="margin-top:8px">${esc(ALT_NOTE)}</div></div>` : ''}
    </article>`;
}

function renderLive(cur, i) {
  if (cur.deload) return '';
  const e = cur.exercises[i];
  if (topReached(e.id, e)) {
    return `<div class="note good">✓ Tüm setlerde ${EX[e.id].reps[1]} tekrara ulaştın! Temiz formla yaptıysan sonraki antrenmanda en küçük adım kadar ağırlık ekle.</div>`;
  }
  return '';
}

function refreshLive(i) {
  const cur = state.current;
  if (!cur) return;
  const live = document.getElementById('live-' + i);
  if (live) live.innerHTML = renderLive(cur, i);
  const { total, done } = countSets(cur);
  const p = $('#prog'); if (p) p.textContent = `${done}/${total} set`;
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
      return `<div class="hist-ex"><span>${esc(ex.name)}</span><span class="v">${v}</span></div>`;
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

function renderSettings() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <h1 class="page-title">Veri</h1>
    <section class="card">
      <h2>Yedekleme</h2>
      <p class="muted small">Kayıtlar yalnızca bu telefonda saklanır. Telefon değiştirirken veya ara sıra güvence için yedek al.</p>
      <button class="btn" data-act="export">Yedeği dışa aktar (JSON)</button>
      <button class="btn" data-act="import">Yedekten içe aktar</button>
      <p class="muted small" style="margin-bottom:0">${state.sessions.length} kayıtlı antrenman${state.current ? ' + 1 devam eden' : ''}.</p>
    </section>
    ${standalone ? '' : `
    <section class="card">
      <h2>Ana ekrana ekle</h2>
      <p class="muted small" style="margin-bottom:0">Safari’de alttaki <b>Paylaş</b> düğmesine (yukarı ok olan kare) dokun → <b>Ana Ekrana Ekle</b>. Böylece uygulama gibi tam ekran ve internetsiz açılır.</p>
    </section>`}
    <section class="card">
      <h2>Tehlikeli bölge</h2>
      <p class="muted small">Tüm antrenman kayıtlarını bu telefondan siler. Geri alınamaz.</p>
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
  if (ex.weighted && s.w == null) {
    toast('Önce ağırlığı gir');
    const inp = document.querySelector(`input[data-ex="${i}"][data-set="${j}"][data-f="w"]`);
    if (inp) inp.focus();
    return;
  }
  if (s.r == null) s.r = s.pr ?? ex.reps[0];
  s.done = true;
  save();
  startTimer(ex.rest, `${ex.name} · dinlenme`);
  render();
  if (topReached(e.id, e) && !cur.deload) toast('Üst tekrar sınırına ulaştın! Sonraki antrenmanda ağırlığı artır.', 3500);
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
  const payload = { app: 'ironlog', version: 1, exportedAt: new Date().toISOString(), data: state };
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
    case 'start': {
      const day = ui.dayChoice || nextDayAuto();
      state.current = buildSession(day, state.week);
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
      if (confirm('TÜM antrenman kayıtları silinsin mi? Bu işlem geri alınamaz.') && confirm('Emin misin? Önce yedek almanı öneririm.')) {
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

/* ---------------- Başlat ---------------- */

render();
if (state.timer) runTimer();

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
