import { useSurveyStore } from '../store/useSurveyStore';
import { maturityLabel, scoreBadgeClass } from '../lib/maturity';
import './RankingTable.css';

export function RankingTable() {
  const branches = useSurveyStore(state => state.config.benchmarks.byBranch);
  const userBranchAnswer = useSurveyStore(state => state.answers.d_branch);

  const sortedBranches = Object.entries(branches).sort((a, b) => b[1] - a[1]);
  const userBranch =
    typeof userBranchAnswer === 'string' ? userBranchAnswer.toLowerCase() : '';

  return (
    <div className="dash-card dash-card--spaced">
      <h3>🏆 Branchen-Ranking: Wo stehen die Top-Performer?</h3>
      <table className="rank-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Branche</th>
            <th>Ø Reifegrad</th>
            <th>Stufe</th>
          </tr>
        </thead>
        <tbody>
          {sortedBranches.map(([branchName, branchScore], position) => {
            const isUserBranch =
              userBranch.length > 0 &&
              userBranch.includes(branchName.toLowerCase().split('/')[0].trim());

            return (
              <tr key={branchName} className={isUserBranch ? 'you' : undefined}>
                <td className="rank-pos">{position + 1}</td>
                <td className="rank-name">
                  {isUserBranch && '→ '}
                  <strong>{branchName}</strong>
                  {isUserBranch && ' (Ihre Branche)'}
                </td>
                <td className="rank-score">
                  <strong>{branchScore.toFixed(1)}</strong>
                </td>
                <td>
                  <span className={`badge ${scoreBadgeClass(branchScore)}`}>
                    {maturityLabel(branchScore)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
