import { useSurveyStore } from '../../store/useSurveyStore';
import type { CostDefaults } from '../../types/survey';
import './CostBlock.css';

type CostKey = keyof CostDefaults;

interface CostField {
  key: CostKey;
  label: string;
  unit: string;
}

const HOURLY_RATES: CostField[] = [
  { key: 'designer', label: '🎨 Designer:in', unit: '€ / Stunde' },
  { key: 'developer', label: '💻 Developer', unit: '€ / Stunde' },
  { key: 'pm', label: '📋 Project Manager', unit: '€ / Stunde' },
  { key: 'researcher', label: '🔬 UX Researcher', unit: '€ / Stunde' },
];

const TEAM_COUNTS: CostField[] = [
  { key: 'numDesigners', label: '👥 Anz. Designer:innen', unit: '' },
  { key: 'numDevs', label: '💻 Anz. Developers (mit Design)', unit: '' },
  { key: 'numPMs', label: '📋 Anz. Project Manager', unit: '' },
  { key: 'hoursYear', label: '📅 Arbeitsstunden / Jahr', unit: '' },
];

interface CostRowProps {
  field: CostField;
}

function CostRow({ field }: CostRowProps) {
  const defaults = useSurveyStore(state => state.config.costDefaults);
  const currentAnswer = useSurveyStore(state => state.answers['cost_' + field.key]);
  const setAnswer = useSurveyStore(state => state.setAnswer);

  const value =
    typeof currentAnswer === 'number'
      ? currentAnswer
      : typeof currentAnswer === 'string' && currentAnswer !== ''
        ? Number(currentAnswer)
        : defaults[field.key];

  return (
    <div className="cost-row">
      <span className="cost-role">{field.label}</span>
      <input
        className="cost-input"
        type="number"
        min={0}
        id={`ci_${field.key}`}
        value={value}
        onChange={event => setAnswer('cost_' + field.key, Number(event.target.value))}
      />
      <span className="cost-unit">{field.unit}</span>
    </div>
  );
}

export function CostBlock() {
  return (
    <>
      <div className="cost-prefilled-badge">
        ✓ Mit Marktdurchschnitten DACH 2026 vorausgefüllt
      </div>
      {HOURLY_RATES.map(field => (
        <CostRow key={field.key} field={field} />
      ))}
      <div className="cost-divider">
        {TEAM_COUNTS.map(field => (
          <CostRow key={field.key} field={field} />
        ))}
      </div>
      <div className="cost-note">
        💡 Tipp: Alle Werte basieren auf Marktdaten für die DACH-Region 2026. Wenn Sie die
        genauen Zahlen nicht kennen, können Sie die Vorgaben einfach übernehmen.
      </div>
    </>
  );
}
