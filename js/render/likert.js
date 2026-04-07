import { state } from '../engine.js';

export function buildLikertScale(question, currentAnswer) {
  const labels = state.config.likertLabels;
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
