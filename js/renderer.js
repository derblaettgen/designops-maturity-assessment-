import {
  state, init, goNext, goPrev, goToStep,
  setAnswer, setMultiAnswer, validate, countAnswered, persistState
} from './engine.js';
import { load } from './storage.js';
import { renderDashboard } from './dashboard.js';
import { buildStepHeader }         from './render/step.js';
import { buildQuestionCard }       from './render/qcard.js';
import { buildSectionProgressBar } from './render/progress.js';
import { buildNavigationButtons }  from './render/nav.js';

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
    `<p style="padding:48px 24px;color:#E53E3E;font-weight:600">
      Fehler beim Laden der Konfiguration.<br>
      <small style="font-weight:400;color:#718096">${error.message}</small>
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
    navigationDirection = stepIndex > state.currentStep ? 'forward' : 'backward';
    goToStep(stepIndex);
    transitionToStep();
  });
}

function attachScrollListener() {
  const progressBar = document.getElementById('progBar');
  window.addEventListener('scroll', () => {
    progressBar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ===== NAVIGATION HANDLERS =====

let navigationDirection = 'forward';

function handleNext() {
  const result = goNext();
  if (!result.valid) {
    applyValidationErrors(result.failedIds);
    const firstErrorCard = document.getElementById('qc-' + result.failedIds[0]);
    if (firstErrorCard) firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  navigationDirection = 'forward';
  transitionToStep();
}

function handlePrev() {
  goPrev();
  navigationDirection = 'backward';
  transitionToStep();
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

// ===== SCROLL =====

function smoothScrollTo(targetY, duration) {
  const startY    = window.scrollY;
  const distance  = targetY - startY;
  const startTime = performance.now();

  function scrollFrame(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = progress < 0.5
      ? 2 * progress * progress
      : 1 - (-2 * progress + 2) ** 2 / 2;
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) requestAnimationFrame(scrollFrame);
  }

  requestAnimationFrame(scrollFrame);
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

function transitionToStep() {
  const mainContainer = document.getElementById('main');
  const currentStepElement = mainContainer.querySelector('.step');

  if (!currentStepElement) {
    renderStep(navigationDirection);
    return;
  }

  mainContainer.style.minHeight = mainContainer.offsetHeight + 'px';

  const exitClass = navigationDirection === 'forward' ? 'exit-to-left' : 'exit-to-right';
  currentStepElement.classList.remove('active');
  currentStepElement.classList.add(exitClass);

  smoothScrollTo(mainContainer.offsetTop, 700);

  currentStepElement.addEventListener('animationend', () => {
    renderStep(navigationDirection);
  }, { once: true });
}

function renderStep(direction) {
  const step          = state.config.steps[state.currentStep];
  const mainContainer = document.getElementById('main');
  const enterClass    = direction === 'backward' ? ' enter-from-left' : '';

  let html = `<div class="step active${enterClass}">`;
  html += buildStepHeader(step);
  step.questions.forEach(question => { html += buildQuestionCard(question); });
  html += buildSectionProgressBar(step);
  html += buildNavigationButtons();
  html += `</div>`;

  mainContainer.innerHTML = html;
  mainContainer.style.minHeight = '';
  updateProgressBar();
}

