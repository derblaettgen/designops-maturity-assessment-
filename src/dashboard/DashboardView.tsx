import { useSurveyStore } from '../store/useSurveyStore';
import { getAllDimensionScores, getOverallScore } from '../lib/scoring';
import { extractCosts, calculateWaste } from '../lib/waste';
import { maturityLabel, maturityLevelKey } from '../lib/maturity';
import { formatCompact } from '../lib/format';
import { KpiCard } from './KpiCard';
import { DimensionBars } from './DimensionBars';
import { RankingTable } from './RankingTable';
import { GapAnalysisTable } from './GapAnalysisTable';
import { RoiHighlight } from './RoiHighlight';
import { RadarChart } from './charts/RadarChart';
import { WasteLevelsChart } from './charts/WasteLevelsChart';
import { RoiChart } from './charts/RoiChart';
import './DashboardView.css';

export function DashboardView() {
  const config = useSurveyStore(state => state.config);
  const answers = useSurveyStore(state => state.answers);

  const dimensionScores = getAllDimensionScores(config, answers);
  const overallScore = getOverallScore(dimensionScores);
  const costs = extractCosts(config.costDefaults, answers);
  const { currentWaste, annualSaving } = calculateWaste(dimensionScores, costs);

  const overall = config.benchmarks.overall;
  const marketDelta = overallScore - overall.marketAvg;
  const isAboveAverage = marketDelta >= 0;

  return (
    <div className="dashboard active">
      <div className="dash-hero">
        <h2>📊 Ihr DesignOps-Ergebnis</h2>
        <p>
          Individuelle Auswertung mit Benchmark-Vergleich gegen Marktdurchschnitt und
          Top-Performer (DACH 2026)
        </p>
      </div>

      <div className="dash-kpis">
        <KpiCard
          level={maturityLevelKey(overallScore)}
          value={overallScore.toFixed(1)}
          label="Ihr Gesamt-Reifegrad"
          badge={maturityLabel(overallScore)}
        />
        <KpiCard
          level="market"
          value={overall.marketAvg.toFixed(1)}
          label="Marktdurchschnitt DACH"
          badge={maturityLabel(overall.marketAvg)}
        />
        <KpiCard
          level="top"
          value={overall.topPerformer.toFixed(1)}
          label="Top-Performer"
          badge={maturityLabel(overall.topPerformer)}
        />
        <KpiCard
          level={isAboveAverage ? 'positive' : 'negative'}
          value={`${isAboveAverage ? '▲' : '▼'} ${Math.abs(marketDelta).toFixed(1)}`}
          label="vs. Markt"
          badge={isAboveAverage ? 'Überdurchschnittlich' : 'Unter Durchschnitt'}
        />
        <KpiCard
          level="waste"
          value={formatCompact(currentWaste)}
          label="Verschwendung / Jahr (aktuell)"
        />
        <KpiCard
          level="saving"
          value={formatCompact(annualSaving)}
          label="Einsparpotenzial / Jahr"
          badge="bei Reifegrad 4.0"
        />
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h3>🕸️ Radar: Sie vs. Markt vs. Top-Performer</h3>
          <RadarChart dimensionScores={dimensionScores} />
        </div>
        <div className="dash-card">
          <h3>📊 Dimensionen im Detail</h3>
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
        </div>
      </div>

      <RankingTable />
      <GapAnalysisTable dimensionScores={dimensionScores} />

      <RoiHighlight annualSaving={annualSaving} costs={costs} />

      <div className="dash-grid">
        <div className="dash-card">
          <h3>💰 Einsparung pro Reifegrad-Stufe</h3>
          <WasteLevelsChart costs={costs} />
        </div>
        <div className="dash-card">
          <h3>📈 ROI über 3 Jahre (realistisches Szenario)</h3>
          <RoiChart annualSaving={annualSaving} />
        </div>
      </div>

      <div className="dash-card dash-card--cta">
        <h3>🚀 Nächste Schritte</h3>
        <p>
          Die vollständigen Studienergebnisse mit allen Branchen-Benchmarks erscheinen im{' '}
          <strong>Q3 2026</strong> auf adesso.de. Nutzen Sie Ihre individuelle Auswertung als
          Basis für Ihren DesignOps Business Case.
        </p>
        <a
          href="https://www.adesso.de"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          Mehr erfahren auf adesso.de →
        </a>
      </div>
    </div>
  );
}
