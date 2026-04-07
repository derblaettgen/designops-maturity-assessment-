import { save } from './storage.js';

export const state = {
  currentStep: 0,
  answers:     {},
  config:      null
};

export function init(config) {
  state.config      = config;
  state.currentStep = 0;
  state.answers     = {};

  const defaults = config.costDefaults;
  Object.keys(defaults).forEach(key => {
    state.answers['cost_' + key] = defaults[key];
  });

  config.sections.forEach(section => {
    section.questions.forEach(question => {
      if (question.prefill && state.answers[question.id] === undefined) {
        state.answers[question.id] = question.prefill;
      }
    });
  });
}

export function setAnswer(questionId, value) {
  state.answers[questionId] = value;
}

export function setMultiAnswer(questionId, values) {
  state.answers[questionId] = values && values.length ? values : undefined;
}

export function restoreAnswers(savedAnswers) {
  Object.assign(state.answers, savedAnswers);
}

export function validate() {
  const section   = state.config.sections[state.currentStep];
  const failedIds = [];

  section.questions.forEach(question => {
    if (!question.req) return;
    const answer = state.answers[question.id];
    if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      failedIds.push(question.id);
    }
  });

  return { valid: failedIds.length === 0, failedIds };
}

export function goNext() {
  const result = validate();
  if (!result.valid) return result;
  state.currentStep = Math.min(state.currentStep + 1, state.config.sections.length - 1);
  return result;
}

export function goPrev() {
  if (state.currentStep === 0) return false;
  state.currentStep--;
  return true;
}

export function goToStep(stepIndex) {
  const maxIndex = state.config.sections.length - 1;
  state.currentStep = Math.max(0, Math.min(stepIndex, maxIndex));
}

export function countAnswered() {
  return Object.values(state.answers).filter(value => value !== undefined && value !== '').length;
}

export function calculateDimensionScore(questionIds) {
  const scores = questionIds
    .map(id => Number(state.answers[id]) || 0)
    .filter(score => score > 0);
  return scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
}

export function getAllDimensions() {
  return state.config.sections.flatMap(section => section.dimensions ?? []);
}

function questionIdsForDimension(dimensionKey) {
  const prefix = dimensionKey + '_';
  return state.config.sections
    .flatMap(section => section.questions)
    .filter(question => question.type === 'likert' && question.id.startsWith(prefix))
    .map(question => question.id);
}

export function getAllDimensionScores() {
  return getAllDimensions().map(dimension => ({
    ...dimension,
    score: calculateDimensionScore(questionIdsForDimension(dimension.key))
  }));
}

export function persistState() {
  save({ currentStep: state.currentStep, answers: state.answers });
}
