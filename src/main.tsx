import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/animations.css';
import './styles/buttons.css';
import './styles/badge.css';

import { surveyConfig } from './config';
import { useSurveyStore } from './store/useSurveyStore';
import { load, save } from './lib/storage';
import { registerChartJs } from './dashboard/charts/registerChartJs';
import { App } from './App';

registerChartJs();

const PERSIST_DEBOUNCE_MS = 250;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let lastPersistedAnswers = useSurveyStore.getState().answers;
let lastPersistedStep = useSurveyStore.getState().currentStep;

useSurveyStore.subscribe(state => {
  if (state.answers === lastPersistedAnswers && state.currentStep === lastPersistedStep) return;
  lastPersistedAnswers = state.answers;
  lastPersistedStep = state.currentStep;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    save({ currentStep: state.currentStep, answers: state.answers });
  }, PERSIST_DEBOUNCE_MS);
});

console.log("Survey is alive and running!");

useSurveyStore.getState().init(surveyConfig, load());

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
