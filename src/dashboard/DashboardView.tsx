import { useMemo, useRef, useState } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { getAllDimensionScores, getOverallScore } from '../lib/scoring';
import type { DimensionWithScore } from '../lib/scoring';
import { extractCosts, calculateWaste } from '../lib/waste';
import type { Costs } from '../lib/waste';
import { exportElementAsPdf } from '../lib/pdfExport';
import { DashboardContent } from './DashboardContent';

const EXPORT_WIDTH_PX = 1440;

interface DashboardViewProps {
  precomputed?: {
    dimensionScores: DimensionWithScore[];
    overallScore: number;
    costs: Costs;
    currentWaste: number;
    annualSaving: number;
  };
  shareUrl?: string;
}

export function DashboardView({ precomputed, shareUrl }: DashboardViewProps = {}) {
  const config = useSurveyStore(state => state.config);
  const answers = useSurveyStore(state => state.answers);
  const exportStageRef = useRef<HTMLDivElement>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExportMounted, setIsExportMounted] = useState(false);

  const computed = useMemo(() => {
    if (precomputed) return precomputed;
    const computedDimensionScores = getAllDimensionScores(config, answers);
    const computedOverallScore = getOverallScore(computedDimensionScores);
    const computedCosts = extractCosts(config.costDefaults, answers);
    const wasteResult = calculateWaste(computedDimensionScores, computedCosts);
    return {
      dimensionScores: computedDimensionScores,
      overallScore: computedOverallScore,
      costs: computedCosts,
      currentWaste: wasteResult.currentWaste,
      annualSaving: wasteResult.annualSaving,
    };
  }, [config, answers, precomputed]);

  const handlePdfClick = async () => {
    setIsPdfLoading(true);
    setIsExportMounted(true);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const exportEl = exportStageRef.current;
      if (!exportEl) throw new Error('Export-Stage nicht gefunden.');

      const filename = `DesignOps-Report-${
        new Date().toISOString().split('T')[0]
      }.pdf`;

      await exportElementAsPdf(exportEl, filename);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`PDF-Export fehlgeschlagen:\n\n${message}`);
    } finally {
      setIsExportMounted(false);
      setIsPdfLoading(false);
    }
  };

  return (
    <>
      <DashboardContent
        {...computed}
        isExportVersion={false}
        onPdfClick={handlePdfClick}
        isPdfLoading={isPdfLoading}
        shareUrl={shareUrl}
      />

      {isExportMounted && (
        <div
          ref={exportStageRef}
          style={{
            position: 'fixed',
            top: 0,
            left: `-${EXPORT_WIDTH_PX + 100}px`,
            width: `${EXPORT_WIDTH_PX}px`,
            background: '#ffffff',
            zIndex: -1,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <DashboardContent
            {...computed}
            isExportVersion={true}
          />
        </div>
      )}
    </>
  );
}
