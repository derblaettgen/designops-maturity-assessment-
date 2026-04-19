import { useEffect } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { StepHeader } from './StepHeader';
import { NavigationButtons } from './NavigationButtons';
import './StepView.css';

interface StepViewProps {
  onSubmit: () => void;
}

export function StepView({ onSubmit }: StepViewProps) {
  const currentStep = useSurveyStore(state => state.currentStep);
  const section = useSurveyStore(state => state.config.sections[state.currentStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  if (!section) return null;

  return (
    <>
      <ProgressBar />
      <div className="step-view">
        <div className="step active" key={section.id}>
          <StepHeader section={section} />
          {section.questions.map(question => (
            <QuestionCard key={question.id} question={question} />
          ))}
          <NavigationButtons onSubmit={onSubmit} />
        </div>
      </div>
    </>
  );
}
