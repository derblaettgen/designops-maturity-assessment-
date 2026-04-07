import { create } from 'zustand';
import type { AnswerValue, SavedState, SurveyConfig } from '../types/survey';

export interface ValidationResult {
  valid: boolean;
  failedIds: string[];
}

interface SurveyState {
  config: SurveyConfig;
  currentStep: number;
  answers: Record<string, AnswerValue>;
  failedIds: string[];

  init: (config: SurveyConfig, saved?: SavedState | null) => void;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  setMultiAnswer: (questionId: string, values: string[]) => void;
  validate: () => ValidationResult;
  goNext: () => ValidationResult;
  goPrev: () => boolean;
  goToStep: (stepIndex: number) => void;
  submit: () => ValidationResult;
}

const EMPTY_CONFIG: SurveyConfig = {
  meta: { title: '', subtitle: '', description: '', duration: 0, year: 0, locale: 'de-DE' },
  likertLabels: [],
  costDefaults: {
    designer: 0, developer: 0, pm: 0, researcher: 0,
    numDesigners: 0, numDevs: 0, numPMs: 0, hoursYear: 0,
  },
  benchmarks: { overall: { marketAvg: 0, topPerformer: 0 }, bySize: {}, byBranch: {} },
  sections: [],
};

function buildInitialAnswers(config: SurveyConfig): Record<string, AnswerValue> {
  const answers: Record<string, AnswerValue> = {};

  (Object.keys(config.costDefaults) as Array<keyof typeof config.costDefaults>).forEach(key => {
    answers['cost_' + key] = config.costDefaults[key];
  });

  config.sections.forEach(section => {
    section.questions.forEach(question => {
      if (question.type === 'select' && question.prefill !== undefined && answers[question.id] === undefined) {
        answers[question.id] = question.prefill;
      }
    });
  });

  return answers;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  config: EMPTY_CONFIG,
  currentStep: 0,
  answers: {},
  failedIds: [],

  init: (config, saved) => {
    const answers = buildInitialAnswers(config);
    if (saved?.answers) {
      Object.assign(answers, saved.answers);
    }
    set({
      config,
      answers,
      currentStep: saved?.currentStep ?? 0,
      failedIds: [],
    });
  },

  setAnswer: (questionId, value) => {
    set(state => ({
      answers: { ...state.answers, [questionId]: value },
      failedIds: state.failedIds.filter(id => id !== questionId),
    }));
  },

  setMultiAnswer: (questionId, values) => {
    set(state => {
      const next = { ...state.answers };
      if (values && values.length) {
        next[questionId] = values;
      } else {
        delete next[questionId];
      }
      return {
        answers: next,
        failedIds: state.failedIds.filter(id => id !== questionId),
      };
    });
  },

  validate: () => {
    const { config, currentStep, answers } = get();
    const section = config.sections[currentStep];
    const failedIds: string[] = [];
    if (!section) return { valid: true, failedIds };

    section.questions.forEach(question => {
      if (!question.req) return;
      const answer = answers[question.id];
      if (
        answer === undefined ||
        answer === '' ||
        (Array.isArray(answer) && answer.length === 0)
      ) {
        failedIds.push(question.id);
      }
    });

    return { valid: failedIds.length === 0, failedIds };
  },

  goNext: () => {
    const result = get().validate();
    if (!result.valid) {
      set({ failedIds: result.failedIds });
      return result;
    }
    set(state => ({
      currentStep: Math.min(state.currentStep + 1, state.config.sections.length - 1),
      failedIds: [],
    }));
    return result;
  },

  goPrev: () => {
    const { currentStep } = get();
    if (currentStep === 0) return false;
    set({ currentStep: currentStep - 1, failedIds: [] });
    return true;
  },

  goToStep: (stepIndex) => {
    const { config } = get();
    const maxIndex = Math.max(0, config.sections.length - 1);
    set({ currentStep: Math.max(0, Math.min(stepIndex, maxIndex)), failedIds: [] });
  },

  submit: () => {
    const result = get().validate();
    set({ failedIds: result.failedIds });
    return result;
  },
}));
