import type { DimensionWithScore } from '../lib/scoring';
import { gapPriorityInfo, maturityLevelKey } from '../lib/maturity';
import './GapAnalysisTable.css';

interface GapAnalysisTableProps {
  dimensionScores: DimensionWithScore[];
}

export function GapAnalysisTable({ dimensionScores }: GapAnalysisTableProps) {
  const sortedByGap = [...dimensionScores]
    .map(dimension => ({ ...dimension, gapToTop: dimension.topPerformer - dimension.score }))
    .sort((a, b) => b.gapToTop - a.gapToTop);

  return (
    <div className="dash-card dash-card--spaced">
      <h3>📋 Gap-Analyse: Ihr Weg zu den Top-Performern</h3>
      <table className="rank-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Dimension</th>
            <th>Ihr Wert</th>
            <th>Top-Performer</th>
            <th>Gap</th>
            <th>Priorität</th>
          </tr>
        </thead>
        <tbody>
          {sortedByGap.map((gap, position) => {
            const priority = gapPriorityInfo(gap.gapToTop);
            return (
              <tr key={gap.key}>
                <td className="gap-pos">{position + 1}</td>
                <td className="gap-name">
                  <strong>{gap.name}</strong>
                </td>
                <td className="gap-score" data-level={maturityLevelKey(gap.score)}>
                  {gap.score.toFixed(1)}
                </td>
                <td className="gap-top">{gap.topPerformer.toFixed(1)}</td>
                <td className="gap-delta">
                  {gap.gapToTop > 0 ? `-${gap.gapToTop.toFixed(1)}` : '✅'}
                </td>
                <td>
                  <span className={`badge ${priority.cssClass}`}>{priority.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
