import { state } from '../engine.js';

export function buildSectionProgressBar(step) {
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
