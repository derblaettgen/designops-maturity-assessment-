export type QuestionType = 'select' | 'likert' | 'multi' | 'textarea' | 'cost';

interface BaseQuestion {
  id: string;
  text: string;
  req: boolean;
  hint?: string;
}

export interface SelectQuestion extends BaseQuestion {
  type: 'select';
  options: string[];
  prefill?: string;
}

export interface LikertQuestion extends BaseQuestion {
  type: 'likert';
}

export interface MultiQuestion extends BaseQuestion {
  type: 'multi';
  options: string[];
}

export interface TextareaQuestion extends BaseQuestion {
  type: 'textarea';
}

export interface CostQuestion extends BaseQuestion {
  type: 'cost';
}

export type Question =
  | SelectQuestion
  | LikertQuestion
  | MultiQuestion
  | TextareaQuestion
  | CostQuestion;

export interface DimensionWaste {
  design: number;
  validation: number;
  production: number;
}

export interface Dimension {
  key: string;
  name: string;
  marketAvg: number;
  topPerformer: number;
  waste: DimensionWaste;
}

export interface Section {
  id: string;
  name: string;
  icon: string;
  title: string;
  desc: string;
  note?: string;
  dimensions?: Dimension[];
  questions: Question[];
}

export interface SurveyMeta {
  title: string;
  subtitle: string;
  description: string;
  duration: number;
  year: number;
  locale: string;
}

export interface CostDefaults {
  designer: number;
  developer: number;
  pm: number;
  researcher: number;
  numDesigners: number;
  numDevs: number;
  numPMs: number;
  hoursYear: number;
}

export interface Benchmarks {
  overall: { marketAvg: number; topPerformer: number };
  bySize: Record<string, number>;
  byBranch: Record<string, number>;
}

export interface SurveyConfig {
  meta: SurveyMeta;
  likertLabels: string[];
  costDefaults: CostDefaults;
  benchmarks: Benchmarks;
  sections: Section[];
}

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export type AnswerValue = string | number | string[];

export interface SavedState {
  currentStep: number;
  answers: Record<string, AnswerValue>;
}
