import {
  state, init, goNext, goPrev, goToStep,
  setAnswer, setMultiAnswer, validate, countAnswered, persistState
} from './engine.js';
import { load } from './storage.js';
import { renderDashboard } from './dashboard.js';

// ===== BOOTSTRAP =====

async function bootstrap() {
  const config = await fetch('./survey.config.json').then(response => {
    if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
    return response.json();
  });

  init(config);

  const savedState = load();
  if (savedState) {
    Object.assign(state.answers, savedState.answers);
    state.currentStep = savedState.currentStep ?? 0;
  }

  attachEventDelegation();
  attachScrollListener();
  renderStep();
}

bootstrap().catch(error => {
  document.getElementById('main').innerHTML =
    `<p style="padding:48px 24px;color:#DC2626;font-weight:600">
      Fehler beim Laden der Konfiguration.<br>
      <small style="font-weight:400;color:#6B7280">${error.message}</small>
    </p>`;
  console.error('[survey] bootstrap error:', error);
});

// ===== EVENT DELEGATION =====

function attachEventDelegation() {
  const mainContainer     = document.getElementById('main');
  const progressDotsPanel = document.getElementById('progDots');

  mainContainer.addEventListener('change', event => {
    const target = event.target;

    if (target.matches('.likert input[type="radio"]')) {
      setAnswer(target.name, Number(target.value));
      markQuestionAnswered(target.name);
      updateSectionProgress();
      persistState();
      return;
    }

    if (target.matches('.sel-wrap select')) {
      const questionId = target.dataset.qid;
      setAnswer(questionId, target.value);
      target.classList.toggle('filled', !!target.value);
      markQuestionAnswered(questionId);
      persistState();
      return;
    }

    if (target.matches('.chips input[type="checkbox"]')) {
      const questionId = target.name;
      const selectedValues = [...mainContainer.querySelectorAll(`.chips input[name="${questionId}"]:checked`)]
        .map(checkbox => checkbox.value);
      setMultiAnswer(questionId, selectedValues.length ? selectedValues : undefined);
      markQuestionAnswered(questionId);
      persistState();
      return;
    }

    if (target.matches('.cost-input')) {
      setAnswer('cost_' + target.dataset.costkey, Number(target.value));
      persistState();
    }
  });

  mainContainer.addEventListener('input', event => {
    const target = event.target;
    if (target.matches('.tarea')) {
      const questionId = target.dataset.qid;
      setAnswer(questionId, target.value);
      markQuestionAnswered(questionId);
      persistState();
    }
  });

  mainContainer.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'next')   handleNext();
    if (action === 'prev')   handlePrev();
    if (action === 'submit') handleSubmit();
  });

  progressDotsPanel.addEventListener('click', event => {
    const dot = event.target.closest('.prog-dot');
    if (!dot) return;
    const stepIndex = [...dot.parentElement.children].indexOf(dot);
    goToStep(stepIndex);
    renderStep();
  });
}

function attachScrollListener() {
  const progressBar = document.getElementById('progBar');
  window.addEventListener('scroll', () => {
    progressBar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ===== NAVIGATION HANDLERS =====

function handleNext() {
  const result = goNext();
  if (!result.valid) {
    applyValidationErrors(result.failedIds);
    const firstErrorCard = document.getElementById('qc-' + result.failedIds[0]);
    if (firstErrorCard) firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    applyValidationErrors(result.failedIds);
    const firstErrorCard = document.getElementById('qc-' + result.failedIds[0]);
    if (firstErrorCard) firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  document.getElementById('main').style.display = 'none';
  document.getElementById('heroSection').style.display = 'none';

  document.getElementById('progFill').style.width = '100%';
  document.getElementById('progLabel').textContent = '📊 Auswertung';
  document.getElementById('progAnswered').textContent = 'Abgeschlossen';
  document.getElementById('progTime').textContent = '';

  renderDashboard();
}

// ===== DOM HELPERS =====

function markQuestionAnswered(questionId) {
  const card = document.getElementById('qc-' + questionId);
  if (card) {
    card.classList.add('answered');
    card.classList.remove('error');
  }
  updateProgressBar();
}

function applyValidationErrors(failedIds) {
  document.querySelectorAll('.qcard.error').forEach(card => card.classList.remove('error'));
  failedIds.forEach(questionId => {
    const card = document.getElementById('qc-' + questionId);
    if (card) card.classList.add('error');
  });
}

// ===== PROGRESS =====

function updateProgressBar() {
  const totalSteps = state.config.steps.length;
  const progressPercent = Math.min(Math.round((state.currentStep / totalSteps) * 100) + 10, 100);

  document.getElementById('progFill').style.width = progressPercent + '%';
  document.getElementById('progLabel').textContent =
    `Abschnitt ${state.currentStep + 1} von ${totalSteps} — ${state.config.sectionNames[state.currentStep]}`;
  document.getElementById('progAnswered').textContent = `${countAnswered()} beantwortet`;
  document.getElementById('progTime').textContent =
    `~${Math.max(1, Math.round((totalSteps - state.currentStep) * 1.3))} Min.`;

  renderProgressDots();
}

function renderProgressDots() {
  const totalSteps = state.config.steps.length;
  document.getElementById('progDots').innerHTML = Array.from({ length: totalSteps }, (_, index) =>
    `<div class="prog-dot ${index < state.currentStep ? 'done' : index === state.currentStep ? 'active' : ''}"></div>`
  ).join('');
}

function updateSectionProgress() {
  const step            = state.config.steps[state.currentStep];
  const likertQuestions = step.questions.filter(question => question.type === 'likert');
  if (!likertQuestions.length) return;

  const answeredCount  = likertQuestions.filter(question => state.answers[question.id]).length;
  const percentComplete = Math.round(answeredCount / likertQuestions.length * 100);

  const fillBar    = document.querySelector('.cb-fill');
  const percentLabel = document.querySelector('.cb-pct');
  if (fillBar)     fillBar.style.width = percentComplete + '%';
  if (percentLabel) percentLabel.textContent = percentComplete + '%';
}

// ===== STEP RENDERING =====

function renderStep() {
  const step          = state.config.steps[state.currentStep];
  const mainContainer = document.getElementById('main');

  let html = `<div class="step active">`;
  html += buildStepHeader(step);
  step.questions.forEach(question => { html += buildQuestionCard(question); });
  html += buildSectionProgressBar(step);
  html += buildNavigationButtons();
  html += `</div>`;

  mainContainer.innerHTML = html;
  window.scrollTo({ top: document.getElementById('progBar').offsetTop, behavior: 'smooth' });
  updateProgressBar();
}

function buildStepHeader(step) {
  const totalSteps = state.config.steps.length;
  let html = `<div class="step-head">`;
  html += `<div class="step-number">Abschnitt ${state.currentStep + 1} von ${totalSteps} — ${state.config.sectionNames[state.currentStep]}</div>`;
  html += `<h2>${step.icon} ${step.title}</h2>`;
  html += `<p>${step.desc}</p>`;
  if (step.note) html += `<div class="study-note">🔬 ${step.note}</div>`;
  html += `</div>`;
  return html;
}

function buildQuestionCard(question) {
  const answer     = state.answers[question.id];
  const isAnswered = answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0);

  let html = `<div class="qcard ${isAnswered ? 'answered' : ''}" id="qc-${question.id}">`;
  html += `<div class="check-mark">✓</div>`;
  html += `<div class="q-id">${question.id.toUpperCase()}${question.req ? ' <span class="q-req">*</span>' : ''}</div>`;
  html += `<div class="q-text">${question.text}</div>`;
  if (question.hint) html += `<div class="q-hint">${question.hint}</div>`;

  switch (question.type) {
    case 'likert':   html += buildLikertScale(question, answer);   break;
    case 'select':   html += buildSelectDropdown(question, answer); break;
    case 'multi':    html += buildMultiSelect(question, answer);   break;
    case 'textarea': html += buildTextarea(question, answer);      break;
    case 'cost':     html += buildCostInputs();                    break;
  }

  html += `</div>`;
  return html;
}

function buildLikertScale(question, currentAnswer) {
  const labels = state.config.labels;
  let html = `<div class="likert">`;
  for (let scale = 1; scale <= 5; scale++) {
    html += `<div class="opt">`;
    html += `<input type="radio" name="${question.id}" id="${question.id}_${scale}" value="${scale}" ${currentAnswer == scale ? 'checked' : ''}>`;
    html += `<label for="${question.id}_${scale}">`;
    html += `<span class="num">${scale}</span>`;
    html += `<span class="lbl">${labels[scale - 1]}</span>`;
    html += `</label></div>`;
  }
  html += `</div>`;
  return html;
}

function buildSelectDropdown(question, currentAnswer) {
  const selectedValue = currentAnswer ?? question.prefill ?? '';
  const filledClass   = selectedValue ? 'filled' : '';
  let html = `<div class="sel-wrap">`;
  html += `<select id="inp-${question.id}" data-qid="${question.id}" class="${filledClass}">`;
  html += `<option value="">Bitte wählen…</option>`;
  question.options.forEach(option => {
    html += `<option value="${option}" ${selectedValue === option ? 'selected' : ''}>${option}</option>`;
  });
  html += `</select></div>`;

  if (question.prefill && currentAnswer === undefined) setAnswer(question.id, question.prefill);

  return html;
}

function buildMultiSelect(question, currentAnswer) {
  let html = `<div class="chips">`;
  question.options.forEach((option, index) => {
    const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(option);
    html += `<div class="chip">`;
    html += `<input type="checkbox" id="${question.id}_${index}" name="${question.id}" value="${option}" ${isChecked ? 'checked' : ''}>`;
    html += `<label for="${question.id}_${index}"><span class="chip-dot"></span>${option}</label>`;
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

function buildTextarea(question, currentAnswer) {
  const value = currentAnswer ?? '';
  return `<textarea class="tarea" id="inp-${question.id}" data-qid="${question.id}" placeholder="Ihr Kommentar (optional)…">${value}</textarea>`;
}

function buildCostInputs() {
  const defaults = state.config.costDefaults;
  const answers  = state.answers;

  let html = `<div class="cost-prefilled-badge">✓ Mit Marktdurchschnitten DACH 2026 vorausgefüllt</div>`;

  const hourlyRates = [
    { key: 'designer',   label: '🎨 Designer:in' },
    { key: 'developer',  label: '💻 Developer' },
    { key: 'pm',         label: '📋 Project Manager' },
    { key: 'researcher', label: '🔬 UX Researcher' }
  ];
  hourlyRates.forEach(rate => {
    const value = answers['cost_' + rate.key] ?? defaults[rate.key];
    html += `<div class="cost-row">
      <span class="cost-role">${rate.label}</span>
      <input class="cost-input" type="number" value="${value}" min="0" id="ci_${rate.key}" data-costkey="${rate.key}">
      <span class="cost-unit">€ / Stunde</span>
    </div>`;
  });

  html += `<div class="cost-divider">`;
  const teamCounts = [
    { key: 'numDesigners', label: '👥 Anz. Designer:innen' },
    { key: 'numDevs',      label: '💻 Anz. Developers (mit Design)' },
    { key: 'numPMs',       label: '📋 Anz. Project Manager' },
    { key: 'hoursYear',    label: '📅 Arbeitsstunden / Jahr' }
  ];
  teamCounts.forEach(item => {
    const value = answers['cost_' + item.key] ?? defaults[item.key];
    html += `<div class="cost-row">
      <span class="cost-role">${item.label}</span>
      <input class="cost-input" type="number" value="${value}" min="0" id="ci_${item.key}" data-costkey="${item.key}">
      <span class="cost-unit"></span>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="cost-note">💡 Tipp: Alle Werte basieren auf Marktdaten für die DACH-Region 2026. Wenn Sie die genauen Zahlen nicht kennen, können Sie die Vorgaben einfach übernehmen.</div>`;

  return html;
}

function buildSectionProgressBar(step) {
  const likertQuestions = step.questions.filter(question => question.type === 'likert');
  if (!likertQuestions.length) return '';

  const answeredCount   = likertQuestions.filter(question => state.answers[question.id]).length;
  const percentComplete = Math.round(answeredCount / likertQuestions.length * 100);

  return `<div class="cb">
    <span class="cb-label">Fortschritt</span>
    <div class="cb-track"><div class="cb-fill" style="width:${percentComplete}%"></div></div>
    <span class="cb-pct">${percentComplete}%</span>
  </div>`;
}

function buildNavigationButtons() {
  const totalSteps = state.config.steps.length;
  const isFirstStep = state.currentStep === 0;
  const isLastStep  = state.currentStep === totalSteps - 1;

  const backButton = isFirstStep
    ? '<div></div>'
    : `<button class="btn btn-ghost" data-action="prev">← Zurück</button>`;

  const forwardButton = isLastStep
    ? `<button class="btn btn-cta" data-action="submit">📊 Ergebnis anzeigen</button>`
    : `<button class="btn btn-primary" data-action="next">Weiter →</button>`;

  return `<div class="nav">
    ${backButton}
    <span class="nav-center">${state.currentStep + 1} / ${totalSteps}</span>
    ${forwardButton}
  </div>`;
}
