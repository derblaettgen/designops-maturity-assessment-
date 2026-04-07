import { useEffect, useRef } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { QuestionCard } from './QuestionCard';
import { StepHeader } from './StepHeader';
import { SectionProgressBar } from './SectionProgressBar';
import { NavigationButtons } from './NavigationButtons';
import './StepView.css';

interface StepViewProps {
  onSubmit: () => void;
}

export function StepView({ onSubmit }: StepViewProps) {
  const currentStep = useSurveyStore(state => state.currentStep);
  const section = useSurveyStore(state => state.config.sections[state.currentStep]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = containerRef.current?.offsetTop ?? 0;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [currentStep]);

  if (!section) return null;

  return (
    <div className="container" ref={containerRef}>
      <div className="step active" key={section.id}>
        <StepHeader section={section} />
        {section.questions.map(question => (
          <QuestionCard key={question.id} question={question} />
        ))}
        <SectionProgressBar section={section} />
        <NavigationButtons onSubmit={onSubmit} />
      </div>
    </div>
  );
}
