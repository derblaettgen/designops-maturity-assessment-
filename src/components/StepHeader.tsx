import type { Section } from '../types/survey';
import './StepHeader.css';

interface StepHeaderProps {
  section: Section;
}

export function StepHeader({ section }: StepHeaderProps) {
  return (
    <div className="step-header">
      <h2>
        {section.icon} {section.title}
      </h2>
      <p>{section.desc}</p>
      {section.note && <div className="study-note">🔬 {section.note}</div>}
    </div>
  );
}
