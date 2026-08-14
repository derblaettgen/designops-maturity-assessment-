/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAdminStats, fetchAdminSubmissions, resolveWorstDimension } from './adminApi';


const DEV_SUBMISSIONS_PREFIX = 'designops-dev-submission-';

describe('fetchAdminStats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('production mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
    });

    it('returns parsed data on success (200 OK)', async () => {
      const mockResponse = {
        total: 5,
        avgScore: 3.2,
        minScore: 1.8,
        maxScore: 4.6,
        earliest: '2025-06-01T10:00:00.000Z',
        latest: '2026-04-15T12:00:00.000Z',
        branches: ['Banking', 'IT']
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const stats = await fetchAdminStats();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://designops-maturity.de/api/v1/survey/stats'
      );
      expect(stats).toEqual(mockResponse);
    });

    it('throws on non-200 response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(fetchAdminStats()).rejects.toThrow('API error: 500');
    });

    it('throws on an unauthorized response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(fetchAdminStats()).rejects.toThrow('API error: 401');
    });
  });

  describe('dev mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true);
    });

    it('returns zeros when no submissions in localStorage', async () => {
      const stats = await fetchAdminStats();

      expect(stats).toEqual({
        total: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        earliest: '',
        latest: '',
        branches: []
      });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('computes stats from localStorage submissions', async () => {
      const submission1 = {
        meta: { submittedAt: '2026-01-01T10:00:00.000Z' },
        rawAnswers: { d_branch: 'Retail' },
        results: { overallScore: 2.0 }
      };
      
      const submission2 = {
        meta: { submittedAt: '2026-02-01T10:00:00.000Z' },
        rawAnswers: { d_branch: 'Banking' },
        results: { overallScore: 4.0 }
      };

      const submission3 = {
        meta: { submittedAt: '2026-01-15T10:00:00.000Z' },
        rawAnswers: { d_branch: 'Retail' }, // duplicate branch should be deduped
        results: { overallScore: 3.0 }
      };

      localStorage.setItem(`${DEV_SUBMISSIONS_PREFIX}1`, JSON.stringify(submission1));
      localStorage.setItem(`${DEV_SUBMISSIONS_PREFIX}2`, JSON.stringify(submission2));
      localStorage.setItem(`${DEV_SUBMISSIONS_PREFIX}3`, JSON.stringify(submission3));
      localStorage.setItem('some-other-key', 'ignored data');

      const stats = await fetchAdminStats();

      expect(stats).toEqual({
        total: 3,
        avgScore: 3.0,
        minScore: 2.0,
        maxScore: 4.0,
        earliest: '2026-01-01T10:00:00.000Z',
        latest: '2026-02-01T10:00:00.000Z',
        branches: ['Banking', 'Retail'] // sorted alphabetically
      });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});

describe('fetchAdminSubmissions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('production mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
    });

    it('returns paginated data on success', async () => {
      const mockResponse = {
        total: 45,
        page: 1,
        limit: 20,
        pages: 3,
        data: Array.from({ length: 20 }).map((_, i) => ({ _id: `sub-${i}` } as any))
      };

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetchAdminSubmissions({ page: '1', limit: '20' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://designops-maturity.de/api/v1/survey?page=1&limit=20'
      );
      expect(response).toEqual(mockResponse);
      expect(response.data.length).toBe(20);
    });

    it('throws on non-200 response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(fetchAdminSubmissions({})).rejects.toThrow('API error: 500');
    });

    it('only includes non-empty params in URL', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await fetchAdminSubmissions({ page: '1', dateFrom: '', branch: '' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://designops-maturity.de/api/v1/survey?page=1'
      );
    });
  });

  describe('dev mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true);
    });

    it('filters correctly and sorts newest first', async () => {
      const submissions = [
        { meta: { submittedAt: '2026-01-01T10:00:00.000Z' }, results: { overallScore: 2.0 }, rawAnswers: { d_branch: 'IT' } },
        { meta: { submittedAt: '2026-02-01T10:00:00.000Z' }, results: { overallScore: 4.0 }, rawAnswers: { d_branch: 'Banking' } },
        { meta: { submittedAt: '2026-03-01T10:00:00.000Z' }, results: { overallScore: 3.5 }, rawAnswers: { d_branch: 'Retail' } },
        { meta: { submittedAt: '2026-04-01T10:00:00.000Z' }, results: { overallScore: 5.0 }, rawAnswers: { d_branch: 'IT' } },
        { meta: { submittedAt: '2026-05-01T10:00:00.000Z' }, results: { overallScore: 1.0 }, rawAnswers: { d_branch: 'Banking' } },
      ];

      submissions.forEach((sub, i) => {
        localStorage.setItem(`${DEV_SUBMISSIONS_PREFIX}${i}`, JSON.stringify(sub));
      });

      const response = await fetchAdminSubmissions({ dateFrom: '2026-02-01', scoreMin: '3' });

      // Should match sub 1, 2, 3
      expect(response.total).toBe(3);
      expect(response.data[0].answers.meta.submittedAt).toBe('2026-04-01T10:00:00.000Z'); // Newest
      expect(response.data[1].answers.meta.submittedAt).toBe('2026-03-01T10:00:00.000Z');
      expect(response.data[2].answers.meta.submittedAt).toBe('2026-02-01T10:00:00.000Z'); // Oldest matching
    });

    it('pagination slices correctly', async () => {
      for (let i = 0; i < 35; i++) {
        const sub = { meta: { submittedAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z` } };
        localStorage.setItem(`${DEV_SUBMISSIONS_PREFIX}${i}`, JSON.stringify(sub));
      }

      const response = await fetchAdminSubmissions({ page: '2', limit: '20' });

      expect(response.total).toBe(35);
      expect(response.page).toBe(2);
      expect(response.limit).toBe(20);
      expect(response.pages).toBe(2);
      expect(response.data.length).toBe(15);
    });
  });
});

describe('resolveWorstDimension', () => {
  it('returns lowest score dimension name', () => {
    const submission = {
      answers: {
        results: {
          dimensionScores: [
            { key: 'd1', name: 'Strategy', score: 3.5 },
            { key: 'd2', name: 'Tools', score: 1.2 },
            { key: 'd3', name: 'Culture', score: 4.0 }
          ]
        }
      }
    } as any;

    expect(resolveWorstDimension(submission)).toBe('Tools');
  });

  it('returns "—" when no dimensionScore', () => {
    const submission = {
      answers: {
        results: {
          dimensionScores: []
        }
      }
    } as any;

    expect(resolveWorstDimension(submission)).toBe('—');
  });
});
