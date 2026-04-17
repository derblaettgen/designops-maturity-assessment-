import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveyStore } from '../store/useSurveyStore';
import { extractCosts } from '../lib/waste';
import { fetchSubmissionById } from '../lib/storage';
import type { SurveySubmission } from '../lib/storage';
import { DashboardView } from '../dashboard/DashboardView';

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const config = useSurveyStore(state => state.config);
  const [submission, setSubmission] = useState<SurveySubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetchSubmissionById(id)
      .then(setSubmission)
      .catch((fetchError: unknown) => {
        const message = fetchError instanceof Error ? fetchError.message : 'Unbekannter Fehler';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <p style={{ textAlign: 'center', padding: '4rem' }}>Ergebnis wird geladen…</p>;
  }

  if (error || !submission) {
    return (
      <p style={{ textAlign: 'center', padding: '4rem', color: 'var(--c-danger)' }}>
        Ergebnis konnte nicht geladen werden: {error ?? 'Nicht gefunden'}
      </p>
    );
  }

  const { results, rawAnswers } = submission.answers;
  const costs = extractCosts(config.costDefaults, rawAnswers);

  return (
    <DashboardView
      precomputed={{
        dimensionScores: results.dimensionScores,
        overallScore: results.overallScore,
        costs,
        currentWaste: results.currentWaste,
        annualSaving: results.annualSaving,
      }}
      shareUrl={window.location.href}
    />
  );
}
