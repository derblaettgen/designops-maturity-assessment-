import { SurveySubmission } from './storage';

const API_BASE = 'https://designops-maturity.de/api/v1';
const DEV_SUBMISSIONS_PREFIX = 'designops-dev-submission-';

export interface AdminStats {
  total: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  earliest: string;
  latest: string;
  branches: string[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  if (import.meta.env.DEV) {
    let total = 0;
    let sumScore = 0;
    let minScore = Infinity;
    let maxScore = -Infinity;
    let earliest = '';
    let latest = '';
    const branches = new Set<string>();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEV_SUBMISSIONS_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            total++;
            const score = data.results?.overallScore || 0;
            sumScore += score;
            minScore = Math.min(minScore, score);
            maxScore = Math.max(maxScore, score);

            const submittedAt = data.meta?.submittedAt || '';
            if (submittedAt) {
              if (!earliest || submittedAt < earliest) earliest = submittedAt;
              if (!latest || submittedAt > latest) latest = submittedAt;
            }

            const branch = data.rawAnswers?.d_branch;
            if (branch) branches.add(branch);
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
    }

    if (total === 0) {
      return {
        total: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        earliest: '',
        latest: '',
        branches: [],
      };
    }

    return {
      total,
      avgScore: sumScore / total,
      minScore,
      maxScore,
      earliest,
      latest,
      branches: Array.from(branches).sort(),
    };
  }

  const response = await fetch(`${API_BASE}/survey/stats`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export interface AdminSubmissionsParams {
  page?: string;
  limit?: string;
  dateFrom?: string;
  dateTo?: string;
  scoreMin?: string;
  scoreMax?: string;
  branch?: string;
}

export interface AdminSubmissionsResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: SurveySubmission[];
}

export function resolveWorstDimension(submission: SurveySubmission): string {
  const scores = submission.answers?.results?.dimensionScores;
  if (!scores?.length) return '—';
  const worst = scores.reduce((a, b) => (a.score <= b.score ? a : b));
  return worst.name;
}

export async function fetchAdminSubmissions(
  params: AdminSubmissionsParams
): Promise<AdminSubmissionsResponse> {
  const limit = parseInt(params.limit || '20', 10);
  const page = parseInt(params.page || '1', 10);

  if (import.meta.env.DEV) {
    const allSubmissions: SurveySubmission[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEV_SUBMISSIONS_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            const _id = key.slice(DEV_SUBMISSIONS_PREFIX.length);
            allSubmissions.push({ _id, answers: data });
          }
        } catch (e) {
          // ignore
        }
      }
    }

    let filtered = allSubmissions;

    if (params.dateFrom) {
      filtered = filtered.filter(sub => (sub.answers.meta?.submittedAt?.slice(0, 10) || '') >= params.dateFrom!);
    }
    if (params.dateTo) {
      filtered = filtered.filter(sub => (sub.answers.meta?.submittedAt?.slice(0, 10) || '') <= params.dateTo!);
    }
    if (params.scoreMin) {
      const min = parseInt(params.scoreMin, 10);
      filtered = filtered.filter(sub => (sub.answers.results?.overallScore || 0) >= min);
    }
    if (params.scoreMax) {
      const max = parseInt(params.scoreMax, 10);
      filtered = filtered.filter(sub => (sub.answers.results?.overallScore || 0) <= max);
    }
    if (params.branch) {
      filtered = filtered.filter(sub => sub.answers.rawAnswers?.d_branch === params.branch);
    }

    filtered.sort((a, b) => {
      const dateA = a.answers.meta?.submittedAt || '';
      const dateB = b.answers.meta?.submittedAt || '';
      return dateB.localeCompare(dateA); // Newest first
    });

    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const end = page * limit;
    const paginatedData = filtered.slice(start, end);

    return {
      total,
      page,
      limit,
      pages,
      data: paginatedData
    };
  }

  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.scoreMin) searchParams.append('scoreMin', params.scoreMin);
  if (params.scoreMax) searchParams.append('scoreMax', params.scoreMax);
  if (params.branch) searchParams.append('branch', params.branch);

  const queryString = searchParams.toString();
  const url = `${API_BASE}/survey${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
