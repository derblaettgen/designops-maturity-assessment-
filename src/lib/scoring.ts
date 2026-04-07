import type { AnswerValue, Dimension, SurveyConfig } from '../types/survey';

export interface DimensionWithScore extends Dimension {
  score: number;
}

export function calculateDimensionScore(
  questionIds: string[],
  answers: Record<string, AnswerValue>
): number {
  const scores = questionIds
    .map(id => Number(answers[id]) || 0)
    .filter(score => score > 0);
  return scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
}

export function getAllDimensions(config: SurveyConfig): Dimension[] {
  return config.sections.flatMap(section => section.dimensions ?? []);
}

function questionIdsForDimension(config: SurveyConfig, dimensionKey: string): string[] {
  const prefix = dimensionKey + '_';
  return config.sections
    .flatMap(section => section.questions)
    .filter(question => question.type === 'likert' && question.id.startsWith(prefix))
    .map(question => question.id);
}

export function getAllDimensionScores(
  config: SurveyConfig,
  answers: Record<string, AnswerValue>
): DimensionWithScore[] {
  return getAllDimensions(config).map(dimension => ({
    ...dimension,
    score: calculateDimensionScore(questionIdsForDimension(config, dimension.key), answers),
  }));
}

export function getOverallScore(dimensionScores: DimensionWithScore[]): number {
  if (!dimensionScores.length) return 0;
  return dimensionScores.reduce((sum, dimension) => sum + dimension.score, 0) / dimensionScores.length;
}

export function countAnswered(answers: Record<string, AnswerValue>): number {
  return Object.values(answers).filter(value => value !== undefined && value !== '').length;
}
