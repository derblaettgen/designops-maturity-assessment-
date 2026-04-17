import { useState } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { getAllDimensionScores, getOverallScore } from '../lib/scoring';
import { extractCosts, calculateWaste } from '../lib/waste';
import { maturityLabel } from '../lib/maturity';
import { submitToMongoDB, clear } from '../lib/storage';
import { StepView } from '../components/StepView';
import { DashboardView } from '../dashboard/DashboardView';

export function SurveyPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleSubmit = () => {
    setIsSubmitted(true);

    const { config, answers } = useSurveyStore.getState();
    const dimensionScores = getAllDimensionScores(config, answers);
    const overallScore = getOverallScore(dimensionScores);
    const costs = extractCosts(config.costDefaults, answers);
    const { currentWaste, annualSaving } = calculateWaste(dimensionScores, costs);

    const results = {
      overallScore,
      maturityLabel: maturityLabel(overallScore),
      dimensionScores,
      currentWaste,
      annualSaving,
    };

    submitToMongoDB(config, answers, results)
      .then(documentId => {
        clear();
        setShareUrl(`${window.location.origin}/survey/result/${documentId}`);
      })
      .catch(() => {
        // Dashboard wird trotzdem angezeigt, Daten sind im Store
      });
  };

  if (isSubmitted) {
    return <DashboardView shareUrl={shareUrl} />;
  }

  return <StepView onSubmit={handleSubmit} />;
}
