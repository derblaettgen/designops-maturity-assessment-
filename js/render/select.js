import { setAnswer } from '../engine.js';

export function buildSelectDropdown(question, currentAnswer) {
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
