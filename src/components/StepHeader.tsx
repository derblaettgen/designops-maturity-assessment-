import type { Section } from '../types/survey';
import { useSurveyStore } from '../store/useSurveyStore';
import './StepHeader.css';

interface StepHeaderProps {
  section: Section;
}

export function StepHeader({ section }: StepHeaderProps) {
  const currentStep = useSurveyStore(state => state.currentStep);
  const totalSteps = useSurveyStore(state => state.config.sections.length);

  return (
    <div className="step-head">
      <div className="step-number">
        Abschnitt {currentStep + 1} von {totalSteps} — {section.name}
      </div>
      <h2>
        {section.icon} {section.title}
      </h2>
      <p>{section.desc}</p>
      {section.note && <div className="study-note">🔬 {section.note}</div>}
    </div>
  );
}
