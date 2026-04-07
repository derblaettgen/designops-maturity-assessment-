import type { Section } from '../types/survey';
import { useSurveyStore } from '../store/useSurveyStore';
import './SectionProgressBar.css';

interface SectionProgressBarProps {
  section: Section;
}

export function SectionProgressBar({ section }: SectionProgressBarProps) {
  const answers = useSurveyStore(state => state.answers);

  const likertQuestions = section.questions.filter(question => question.type === 'likert');
  if (!likertQuestions.length) return null;

  const answeredCount = likertQuestions.filter(question => answers[question.id]).length;
  const percentComplete = Math.round((answeredCount / likertQuestions.length) * 100);

  return (
    <div className="cb">
      <span className="cb-label">Fortschritt</span>
      <div className="cb-track">
        <div className="cb-fill" style={{ width: `${percentComplete}%` }} />
      </div>
      <span className="cb-pct">{percentComplete}%</span>
    </div>
  );
}
