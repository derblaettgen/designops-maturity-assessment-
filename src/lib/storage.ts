import type { AnswerValue, SavedState, SurveyConfig } from '../types/survey';
import type { DimensionWithScore } from './scoring';

const STORAGE_KEY = 'designops-survey-v1';
const API_BASE = 'http://217.160.192.226/api/v1';
const API_KEY = 'a68749be2f1d32fefae3a95ed2f20eb2b499e7076eae581fc77853705a3bb552';

export function save(data: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private browsing
  }
}

export function load(): SavedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SavedState) : null;
  } catch {
    return null;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

export interface SurveyResults {
  overallScore: number;
  maturityLabel: string;
  dimensionScores: DimensionWithScore[];
  currentWaste: number;
  annualSaving: number;
}

export interface SurveySubmission {
  _id: string;
  answers: {
    meta: {
      submittedAt: string;
      surveyYear: number;
      locale: string;
    };
    rawAnswers: Record<string, AnswerValue>;
    results: SurveyResults;
  };
}

export async function submitToMongoDB(
  config: SurveyConfig,
  answers: Record<string, AnswerValue>,
  results: SurveyResults,
): Promise<string> {
  const document = {
    meta: {
      submittedAt: new Date().toISOString(),
      surveyYear: config.meta.year,
      locale: config.meta.locale,
    },
    rawAnswers: answers,
    results,
  };

  const response = await fetch(`${API_BASE}/survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const saved = (await response.json()) as { _id?: string; id?: string };
  const documentId = saved._id ?? saved.id;

  if (!documentId) {
    throw new Error('No ID returned from API');
  }

  return documentId;
}

export async function fetchSubmissionById(id: string): Promise<SurveySubmission> {
  const response = await fetch(`${API_BASE}/survey/${id}`, {
    headers: { 'X-API-Key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return (await response.json()) as SurveySubmission;
}
