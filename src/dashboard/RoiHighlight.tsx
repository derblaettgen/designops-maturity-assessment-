import { formatCompact } from '../lib/format';
import type { Costs } from '../lib/waste';
import './RoiHighlight.css';

interface RoiHighlightProps {
  annualSaving: number;
  costs: Costs;
}

export function RoiHighlight({ annualSaving, costs }: RoiHighlightProps) {
  const averageRate = Math.round((costs.designerRate + costs.developerRate + costs.pmRate) / 3);

  return (
    <div className="roi-highlight">
      <div className="sub">💰 Jährliches Einsparpotenzial bei Reifegrad 4.0</div>
      <div className="big">{formatCompact(annualSaving)}</div>
      <div className="sub">
        Basierend auf {costs.designerCount} Designer:innen, {costs.developerCount} Developers,{' '}
        {costs.pmCount} PMs · Stundensätze: Ø {averageRate} €
      </div>
    </div>
  );
}
