import { state } from '../engine.js';

export function buildStepHeader(step) {
  const totalSteps = state.config.steps.length;
  let html = `<div class="step-head">`;
  html += `<div class="step-number">Abschnitt ${state.currentStep + 1} von ${totalSteps} — ${state.config.sectionNames[state.currentStep]}</div>`;
  html += `<h2>${step.icon} ${step.title}</h2>`;
  html += `<p>${step.desc}</p>`;
  if (step.note) html += `<div class="study-note">🔬 ${step.note}</div>`;
  html += `</div>`;
  return html;
}
