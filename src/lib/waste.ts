import type { AnswerValue, CostDefaults, SurveyConfig } from '../types/survey';
import type { DimensionWithScore } from './scoring';
import { getAllDimensions } from './scoring';

export interface Costs {
  designerRate: number;
  developerRate: number;
  pmRate: number;
  designerCount: number;
  developerCount: number;
  pmCount: number;
  hoursPerYear: number;
}

function pickNumber(value: AnswerValue | undefined, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export function extractCosts(
  defaults: CostDefaults,
  answers: Record<string, AnswerValue>
): Costs {
  return {
    designerRate: pickNumber(answers.cost_designer, defaults.designer),
    developerRate: pickNumber(answers.cost_developer, defaults.developer),
    pmRate: pickNumber(answers.cost_pm, defaults.pm),
    designerCount: pickNumber(answers.cost_numDesigners, defaults.numDesigners),
    developerCount: pickNumber(answers.cost_numDevs, defaults.numDevs),
    pmCount: pickNumber(answers.cost_numPMs, defaults.numPMs),
    hoursPerYear: pickNumber(answers.cost_hoursYear, defaults.hoursYear),
  };
}

export function wasteMultiplier(maturityLevel: number): number {
  return Math.max(0.05, 1 - ((maturityLevel - 1) / 4) * 0.95);
}

function dimensionAnnualBase(
  waste: { design: number; validation: number; production: number },
  costs: Costs
): number {
  return (
    (waste.design * costs.designerCount * costs.designerRate +
      waste.validation * costs.developerCount * costs.developerRate +
      waste.production * costs.pmCount * costs.pmRate) *
    costs.hoursPerYear
  );
}

export interface WasteResult {
  currentWaste: number;
  targetWaste: number;
  annualSaving: number;
}

export function calculateWaste(
  dimensionScores: DimensionWithScore[],
  costs: Costs
): WasteResult {
  let currentWaste = 0;
  let targetWaste = 0;

  dimensionScores.forEach(dimension => {
    const annualBase = dimensionAnnualBase(dimension.waste, costs);
    currentWaste += annualBase * wasteMultiplier(dimension.score);
    targetWaste += annualBase * wasteMultiplier(4);
  });

  return { currentWaste, targetWaste, annualSaving: currentWaste - targetWaste };
}

export function wasteByMaturityLevel(
  config: SurveyConfig,
  costs: Costs
): number[] {
  const dimensions = getAllDimensions(config);
  return [1, 2, 3, 4, 5].map(level => {
    let totalWaste = 0;
    dimensions.forEach(dimension => {
      totalWaste += dimensionAnnualBase(dimension.waste, costs) * wasteMultiplier(level);
    });
    return totalWaste;
  });
}
