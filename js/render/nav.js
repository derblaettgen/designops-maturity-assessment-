import { state } from '../engine.js';

export function buildNavigationButtons() {
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
