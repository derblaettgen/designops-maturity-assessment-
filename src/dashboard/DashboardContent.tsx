import { useState } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { maturityLabel, maturityLevelKey } from '../lib/maturity';
import { formatCompact, formatScore, formatSignedDelta } from '../lib/format';
import { KpiCard, type KpiLevel } from './KpiCard';
import { DashCard } from './DashCard';
import { DimensionBars } from './DimensionBars';
import { RankingTable } from './RankingTable';
import { GapAnalysisTable } from './GapAnalysisTable';
import { RoiHighlight } from './RoiHighlight';
import { RadarChart } from './charts/RadarChart';
import { WasteLevelsChart } from './charts/WasteLevelsChart';
import { RoiChart } from './charts/RoiChart';
import type { DimensionWithScore } from '../lib/scoring';
import type { Costs } from '../lib/waste';
import './DashboardView.css';

interface KpiCardData {
  level: KpiLevel;
  value: string;
  label: string;
  badge?: string;
}

interface DashboardContentProps {
  dimensionScores: DimensionWithScore[];
  overallScore: number;
  costs: Costs;
  currentWaste: number;
  annualSaving: number;
  isExportVersion?: boolean;
  onPdfClick?: () => void;
  isPdfLoading?: boolean;
  shareUrl?: string | null;
}

export function DashboardContent({
  dimensionScores,
  overallScore,
  costs,
  currentWaste,
  annualSaving,
  isExportVersion = false,
  onPdfClick,
  isPdfLoading = false,
  shareUrl,
}: DashboardContentProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const shareText = `Mein DesignOps-Reifegrad: ${formatScore(overallScore)} / 5.00 – schau dir meine Auswertung an!`;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl!)}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent('Mein DesignOps Maturity Ergebnis');
    const body = encodeURIComponent(shareText + '\n\n' + shareUrl);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const config = useSurveyStore(state => state.config);
  const overall = config.benchmarks.overall;
  const marketDelta = overallScore - overall.marketAvg;
  const isAboveAverage = marketDelta >= 0;

  const kpiCards: KpiCardData[] = [
    {
      level: maturityLevelKey(overallScore),
      value: formatScore(overallScore),
      label: 'Ihr Gesamt-Reifegrad',
      badge: maturityLabel(overallScore),
    },
    {
      level: 'market',
      value: formatScore(overall.marketAvg),
      label: 'Marktdurchschnitt DACH',
      badge: maturityLabel(overall.marketAvg),
    },
    {
      level: 'top',
      value: formatScore(overall.topPerformer),
      label: 'Top-Performer',
      badge: maturityLabel(overall.topPerformer),
    },
    {
      level: isAboveAverage ? 'positive' : 'negative',
      value: formatSignedDelta(marketDelta),
      label: 'vs. Markt',
      badge: isAboveAverage ? 'Überdurchschnittlich' : 'Unter Durchschnitt',
    },
    {
      level: 'waste',
      value: formatCompact(currentWaste),
      label: 'Verschwendung / Jahr (aktuell)',
    },
    {
      level: 'saving',
      value: formatCompact(annualSaving),
      label: 'Einsparpotenzial / Jahr',
      badge: 'bei Reifegrad 4.0',
    },
  ];

  return (
    <div className="dashboard active">
      <div className="dash-hero" data-pdf-block>
        <div className="dash-hero__row">
          <div>
            <h2>📊 Ihr DesignOps-Ergebnis</h2>
            <p>
              Individuelle Auswertung mit Benchmark-Vergleich gegen
              Marktdurchschnitt und Top-Performer (DACH 2026)
            </p>
          </div>
          {!isExportVersion && (
            <div className="dash-hero__actions">
              <button
                className="btn btn-primary"
                onClick={onPdfClick}
                disabled={isPdfLoading}
              >
                {isPdfLoading ? '⏳ PDF wird erstellt…' : '📥 PDF herunterladen'}
              </button>
              {shareUrl && (
                <div className="share-dropdown">
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsShareOpen(!isShareOpen)}
                  >
                    🔗 Ergebnisse teilen
                  </button>
                  {isShareOpen && (
                    <div className="share-dropdown__menu">
                      <button className="share-dropdown__item" onClick={shareToWhatsApp}>
                        WhatsApp
                      </button>
                      <button className="share-dropdown__item" onClick={shareToLinkedIn}>
                        LinkedIn
                      </button>
                      <button className="share-dropdown__item" onClick={shareByEmail}>
                        E-Mail
                      </button>
                      <button className="share-dropdown__item" onClick={handleCopyLink}>
                        {isCopied ? '✓ Kopiert!' : 'Link kopieren'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="dash-kpis" data-pdf-block>
        {kpiCards.map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="dash-grid" data-pdf-block>
        <DashCard title="🕸️ Radar: Sie vs. Markt vs. Top-Performer">
          <RadarChart dimensionScores={dimensionScores} />
        </DashCard>
        <DashCard title="📊 Dimensionen im Detail">
          <DimensionBars dimensionScores={dimensionScores} />
          <div className="bench-legend">
            <span>
              <span className="dot dot--user" /> Ihr Wert
            </span>
            <span>
              <span className="dot dot--market" /> Marktdurchschnitt
            </span>
            <span>
              <span className="line" /> Top-Performer
            </span>
          </div>
        </DashCard>
      </div>

      <div data-pdf-block>
        <RankingTable />
      </div>
      <div data-pdf-block>
        <GapAnalysisTable dimensionScores={dimensionScores} />
      </div>

      <div data-pdf-block>
        <RoiHighlight annualSaving={annualSaving} costs={costs} />
      </div>

      <div className="dash-grid" data-pdf-block>
        <DashCard title="💰 Einsparung pro Reifegrad-Stufe">
          <WasteLevelsChart costs={costs} />
        </DashCard>
        <DashCard title="📈 ROI über 3 Jahre (realistisches Szenario)">
          <RoiChart annualSaving={annualSaving} />
        </DashCard>
      </div>

      <div className="dash-card dash-card--cta" data-pdf-block>
        <h3>🚀 Nächste Schritte</h3>
        <p>
          Die vollständigen Studienergebnisse inklusive aller Branchen-Benchmarks erscheinen im <strong>Q3 2026</strong> auf adesso.de. Nutzen Sie Ihre
          individuelle Auswertung als als fundierte Basis für Ihren DesignOps Business Case – und lassen Sie uns gemeinsam die nächsten Schritte ableiten.
        </p>
        <a
          href="mailto:andreas.joerder@adesso.de?subject=Interesse an Beratungsgespräch zum DesignOps Maturity Assessment&body=Hallo%20adesso%20Team,%0D%0A%0D%0Aich%20habe%20mein%20DesignOps%20Maturity%20Ergebnis%20erhalten%20und%20möchte%20gerne%20ein%20Beratungsgespräch%20vereinbaren,%20um%20die%20Ergebnisse%20zu%20besprechen%20und%20nächste%20Schritte%20abzuleiten.%0D%0A%0D%0AMein%20aktueller%20Reifegrad:%20${formatScore(overallScore)}%0D%0AMein%20Hauptinteresse:%0D%0A- %20Ergebnisse%20besprechen,%0D%0A- %20Maßnahmenplan%20ableiten,%0D%0A- %20Best-Practices%20und%20Ressourcen,%0D%0A- %20Individuelle Beratung,%0D%0A- %20Sonstiges:%20[bitte hier ergänzen]%0D%0A%0D%0AIch freue mich auf Ihre Rückmeldung und die Möglichkeit, gemeinsam die nächsten Schritte zu planen.%0D%0A%0D%0AMit freundlichen Grüßen,%0D%0A[Ihr Name]"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          Jetzt Beratungsgespräch vereinbaren 📧
        </a>
      </div>
    </div>
  );
}
