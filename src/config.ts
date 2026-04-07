import rawConfig from '../survey.config.json';
import type { SurveyConfig } from './types/survey';

export const surveyConfig = rawConfig as unknown as SurveyConfig;
