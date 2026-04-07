import type { DimensionWithScore } from '../lib/scoring';
import { maturityLevelKey } from '../lib/maturity';
import './DimensionBars.css';

interface DimensionBarsProps {
  dimensionScores: DimensionWithScore[];
}

export function DimensionBars({ dimensionScores }: DimensionBarsProps) {
  return (
    <div>
      {dimensionScores.map(dimension => {
        const scorePercent = (dimension.score / 5) * 100;
        const topPerformerPercent = (dimension.topPerformer / 5) * 100;
        const marketAvgPercent = (dimension.marketAvg / 5) * 100;

        return (
          <div className="dim-row" key={dimension.key}>
            <span className="dim-lbl">{dimension.name}</span>
            <div className="dim-track">
              <div
                className="dim-fill"
                data-level={maturityLevelKey(dimension.score)}
                style={{ width: `${scorePercent}%` }}
              />
              <div
                className="dim-bench"
                title="Top-Performer"
                style={{ left: `${topPerformerPercent}%` }}
              />
              <div
                className="dim-bench-avg"
                title="Marktdurchschnitt"
                style={{ left: `${marketAvgPercent}%` }}
              />
            </div>
            <span className="dim-val">{dimension.score.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
