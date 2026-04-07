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
import { App } from './App';

useSurveyStore.subscribe(state => {
  save({ currentStep: state.currentStep, answers: state.answers });
});

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
