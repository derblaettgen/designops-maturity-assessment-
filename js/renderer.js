/**
 * renderer.js — entry point (ES module).
 * Reads config + state, writes DOM. No business logic.
 * Event delegation replaces all inline handlers.
 */

import { state, init, goNext, goPrev, goTo, setAnswer, setMulti, validate, countAnswered } from './engine.js';
import { save, load } from './storage.js';
import { renderDashboard } from './dashboard.js';

// ===== BOOTSTRAP =====

async function bootstrap() {
  const config = await fetch('./survey.config.json').then(r => {
    if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`);
    return r.json();
  });

  init(config);

  const saved = load();
  if (saved) {
    // Restore previously saved progress
    Object.assign(state.ans, saved.ans);
    state.cur = saved.cur ?? 0;
  }

  attachEventDelegation();
  attachScrollListener();
  renderStep();
}

bootstrap().catch(err => {
  document.getElementById('main').innerHTML =
    `<p style="padding:48px 24px;color:#DC2626;font-weight:600">
      Fehler beim Laden der Konfiguration.<br>
      <small style="font-weight:400;color:#6B7280">${err.message}</small>
    </p>`;
  console.error('[survey] bootstrap error:', err);
});

// ===== EVENT DELEGATION =====

function attachEventDelegation() {
  const main     = document.getElementById('main');
  const progDots = document.getElementById('progDots');

  // ---- change events: radio, select, checkbox, cost number inputs ----
  main.addEventListener('change', e => {
    const t = e.target;

    if (t.matches('.likert input[type="radio"]')) {
      setAnswer(t.name, Number(t.value));
      markAnswered(t.name);
      updateSectionProgress();
      save({ cur: state.cur, ans: state.ans });
      return;
    }

    if (t.matches('.sel-wrap select')) {
      const id = t.dataset.qid;
      setAnswer(id, t.value);
      t.classList.toggle('filled', !!t.value);
      markAnswered(id);
      save({ cur: state.cur, ans: state.ans });
      return;
    }

    if (t.matches('.chips input[type="checkbox"]')) {
      const id = t.name;
      const checked = [...main.querySelectorAll(`.chips input[name="${id}"]:checked`)]
        .map(cb => cb.value);
      setMulti(id, checked.length ? checked : undefined);
      markAnswered(id);
      save({ cur: state.cur, ans: state.ans });
      return;
    }

    if (t.matches('.cost-input')) {
      setAnswer('cost_' + t.dataset.costkey, Number(t.value));
      save({ cur: state.cur, ans: state.ans });
    }
  });

  // ---- input events: textarea ----
  main.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('.tarea')) {
      const id = t.dataset.qid;
      setAnswer(id, t.value);
      markAnswered(id);
      save({ cur: state.cur, ans: state.ans });
    }
  });

  // ---- click events: nav buttons ----
  main.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'next')   handleNext();
    if (action === 'prev')   handlePrev();
    if (action === 'submit') handleSubmit();
  });

  // ---- dot navigation ----
  progDots.addEventListener('click', e => {
    const dot = e.target.closest('.prog-dot');
    if (!dot) return;
    const i = [...dot.parentElement.children].indexOf(dot);
    goTo(i);
    renderStep();
  });
}

function attachScrollListener() {
  const bar = document.getElementById('progBar');
  window.addEventListener('scroll', () => {
    bar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ===== NAVIGATION HANDLERS =====

function handleNext() {
  const result = goNext();
  if (!result.valid) {
    applyErrors(result.failedIds);
    // Scroll to first error card
    const firstError = document.getElementById('qc-' + result.failedIds[0]);
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  renderStep();
}

function handlePrev() {
  goPrev();
  renderStep();
}

function handleSubmit() {
  const result = validate();
  if (!result.valid) {
    applyErrors(result.failedIds);
    const firstError = document.getElementById('qc-' + result.failedIds[0]);
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Hide survey sections
  document.getElementById('main').style.display = 'none';
  document.getElementById('heroSection').style.display = 'none';

  // Update progress bar to show completion
  document.getElementById('progFill').style.width = '100%';
  document.getElementById('progLabel').textContent = '📊 Auswertung';
  document.getElementById('progAnswered').textContent = 'Abgeschlossen';
  document.getElementById('progTime').textContent = '';

  renderDashboard();
}

// ===== DOM HELPERS =====

function markAnswered(id) {
  const card = document.getElementById('qc-' + id);
  if (card) {
    card.classList.add('answered');
    card.classList.remove('error');
  }
  updateProg();
}

function applyErrors(failedIds) {
  // Clear all current errors first
  document.querySelectorAll('.qcard.error').forEach(c => c.classList.remove('error'));
  failedIds.forEach(id => {
    const card = document.getElementById('qc-' + id);
    if (card) card.classList.add('error');
  });
}

// ===== PROGRESS =====

function updateProg() {
  const total = state.config.steps.length;
  const pct   = Math.min(Math.round((state.cur / total) * 100) + 10, 100);

  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progLabel').textContent =
    `Abschnitt ${state.cur + 1} von ${total} — ${state.config.sectionNames[state.cur]}`;
  document.getElementById('progAnswered').textContent = `${countAnswered()} beantwortet`;
  document.getElementById('progTime').textContent =
    `~${Math.max(1, Math.round((total - state.cur) * 1.3))} Min.`;

  renderDots();
}

function renderDots() {
  const total = state.config.steps.length;
  document.getElementById('progDots').innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="prog-dot ${i < state.cur ? 'done' : i === state.cur ? 'active' : ''}"></div>`
  ).join('');
}

function updateSectionProgress() {
  const step   = state.config.steps[state.cur];
  const lqs    = step.questions.filter(q => q.type === 'likert');
  if (!lqs.length) return;

  const answered = lqs.filter(q => state.ans[q.id]).length;
  const pct      = Math.round(answered / lqs.length * 100);

  const fill = document.querySelector('.cb-fill');
  const pctEl = document.querySelector('.cb-pct');
  if (fill)  fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

// ===== STEP RENDERING =====

function renderStep() {
  const step = state.config.steps[state.cur];
  const main = document.getElementById('main');

  let h = `<div class="step active">`;
  h += renderStepHead(step);
  step.questions.forEach(q => { h += renderQuestion(q); });
  h += renderSectionProgress(step);
  h += renderNav();
  h += `</div>`;

  main.innerHTML = h;
  window.scrollTo({ top: document.getElementById('progBar').offsetTop, behavior: 'smooth' });
  updateProg();
}

function renderStepHead(step) {
  const total = state.config.steps.length;
  let h = `<div class="step-head">`;
  h += `<div class="step-number">Abschnitt ${state.cur + 1} von ${total} — ${state.config.sectionNames[state.cur]}</div>`;
  h += `<h2>${step.icon} ${step.title}</h2>`;
  h += `<p>${step.desc}</p>`;
  if (step.note) h += `<div class="study-note">🔬 ${step.note}</div>`;
  h += `</div>`;
  return h;
}

function renderQuestion(q) {
  const a        = state.ans[q.id];
  const answered = a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);

  let h = `<div class="qcard ${answered ? 'answered' : ''}" id="qc-${q.id}">`;
  h += `<div class="check-mark">✓</div>`;
  h += `<div class="q-id">${q.id.toUpperCase()}${q.req ? ' <span class="q-req">*</span>' : ''}</div>`;
  h += `<div class="q-text">${q.text}</div>`;
  if (q.hint) h += `<div class="q-hint">${q.hint}</div>`;

  switch (q.type) {
    case 'likert':   h += buildLikert(q, a);   break;
    case 'select':   h += buildSelect(q, a);   break;
    case 'multi':    h += buildMulti(q, a);    break;
    case 'textarea': h += buildTextarea(q, a); break;
    case 'cost':     h += buildCost();         break;
  }

  h += `</div>`;
  return h;
}

function buildLikert(q, a) {
  const labels = state.config.labels;
  let h = `<div class="likert">`;
  for (let i = 1; i <= 5; i++) {
    h += `<div class="opt">`;
    h += `<input type="radio" name="${q.id}" id="${q.id}_${i}" value="${i}" ${a == i ? 'checked' : ''}>`;
    h += `<label for="${q.id}_${i}">`;
    h += `<span class="num">${i}</span>`;
    h += `<span class="lbl">${labels[i - 1]}</span>`;
    h += `</label></div>`;
  }
  h += `</div>`;
  return h;
}

function buildSelect(q, a) {
  const val = a ?? q.prefill ?? '';
  const filled = val ? 'filled' : '';
  let h = `<div class="sel-wrap">`;
  h += `<select id="inp-${q.id}" data-qid="${q.id}" class="${filled}">`;
  h += `<option value="">Bitte wählen…</option>`;
  q.options.forEach(o => {
    h += `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`;
  });
  h += `</select></div>`;

  // Sync prefill into state so it's available on submit without interaction
  if (q.prefill && a === undefined) setAnswer(q.id, q.prefill);

  return h;
}

function buildMulti(q, a) {
  let h = `<div class="chips">`;
  q.options.forEach((o, i) => {
    const checked = Array.isArray(a) && a.includes(o);
    h += `<div class="chip">`;
    h += `<input type="checkbox" id="${q.id}_${i}" name="${q.id}" value="${o}" ${checked ? 'checked' : ''}>`;
    h += `<label for="${q.id}_${i}"><span class="chip-dot"></span>${o}</label>`;
    h += `</div>`;
  });
  h += `</div>`;
  return h;
}

function buildTextarea(q, a) {
  const val = a ?? '';
  return `<textarea class="tarea" id="inp-${q.id}" data-qid="${q.id}" placeholder="Ihr Kommentar (optional)…">${val}</textarea>`;
}

function buildCost() {
  const d = state.config.costDefaults;
  const ans = state.ans;

  let h = `<div class="cost-prefilled-badge">✓ Mit Marktdurchschnitten DACH 2026 vorausgefüllt</div>`;

  const rates = [
    { k: 'designer',   lbl: '🎨 Designer:in' },
    { k: 'developer',  lbl: '💻 Developer' },
    { k: 'pm',         lbl: '📋 Project Manager' },
    { k: 'researcher', lbl: '🔬 UX Researcher' }
  ];
  rates.forEach(r => {
    const v = ans['cost_' + r.k] ?? d[r.k];
    h += `<div class="cost-row">
      <span class="cost-role">${r.lbl}</span>
      <input class="cost-input" type="number" value="${v}" min="0" id="ci_${r.k}" data-costkey="${r.k}">
      <span class="cost-unit">€ / Stunde</span>
    </div>`;
  });

  h += `<div class="cost-divider">`;
  const counts = [
    { k: 'numDesigners', lbl: '👥 Anz. Designer:innen' },
    { k: 'numDevs',      lbl: '💻 Anz. Developers (mit Design)' },
    { k: 'numPMs',       lbl: '📋 Anz. Project Manager' },
    { k: 'hoursYear',    lbl: '📅 Arbeitsstunden / Jahr' }
  ];
  counts.forEach(r => {
    const v = ans['cost_' + r.k] ?? d[r.k];
    h += `<div class="cost-row">
      <span class="cost-role">${r.lbl}</span>
      <input class="cost-input" type="number" value="${v}" min="0" id="ci_${r.k}" data-costkey="${r.k}">
      <span class="cost-unit"></span>
    </div>`;
  });
  h += `</div>`;

  h += `<div class="cost-note">💡 Tipp: Alle Werte basieren auf Marktdaten für die DACH-Region 2026. Wenn Sie die genauen Zahlen nicht kennen, können Sie die Vorgaben einfach übernehmen.</div>`;

  return h;
}

function renderSectionProgress(step) {
  const lqs = step.questions.filter(q => q.type === 'likert');
  if (!lqs.length) return '';

  const answered = lqs.filter(q => state.ans[q.id]).length;
  const pct      = Math.round(answered / lqs.length * 100);

  return `<div class="cb">
    <span class="cb-label">Fortschritt</span>
    <div class="cb-track"><div class="cb-fill" style="width:${pct}%"></div></div>
    <span class="cb-pct">${pct}%</span>
  </div>`;
}

function renderNav() {
  const total   = state.config.steps.length;
  const isFirst = state.cur === 0;
  const isLast  = state.cur === total - 1;

  const back = isFirst
    ? '<div></div>'
    : `<button class="btn btn-ghost" data-action="prev">← Zurück</button>`;

  const fwd = isLast
    ? `<button class="btn btn-cta" data-action="submit">📊 Ergebnis anzeigen</button>`
    : `<button class="btn btn-primary" data-action="next">Weiter →</button>`;

  return `<div class="nav">
    ${back}
    <span class="nav-center">${state.cur + 1} / ${total}</span>
    ${fwd}
  </div>`;
}
