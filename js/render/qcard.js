import { state } from '../engine.js';
import { buildLikertScale }    from './likert.js';
import { buildSelectDropdown } from './select.js';
import { buildMultiSelect }    from './multi.js';
import { buildTextarea }       from './textarea.js';
import { buildCostInputs }     from './cost.js';

export function buildQuestionCard(question) {
  const answer     = state.answers[question.id];
  const isAnswered = answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0);

  let html = `<div class="qcard ${isAnswered ? 'answered' : ''}" id="qc-${question.id}">`;
  html += `<div class="check-mark">✓</div>`;
  html += `<div class="q-id">${question.id.toUpperCase()}${question.req ? ' <span class="q-req">*</span>' : ''}</div>`;
  html += `<div class="q-text">${question.text}</div>`;
  if (question.hint) html += `<div class="q-hint">${question.hint}</div>`;

  switch (question.type) {
    case 'likert':   html += buildLikertScale(question, answer);    break;
    case 'select':   html += buildSelectDropdown(question, answer); break;
    case 'multi':    html += buildMultiSelect(question, answer);    break;
    case 'textarea': html += buildTextarea(question, answer);       break;
    case 'cost':     html += buildCostInputs();                     break;
  }

  html += `</div>`;
  return html;
}
