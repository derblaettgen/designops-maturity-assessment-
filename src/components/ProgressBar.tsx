import { useEffect, useState } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { countAnswered } from '../lib/scoring';
import './ProgressBar.css';

export function ProgressBar() {
  const sections = useSurveyStore(state => state.config.sections);
  const currentStep = useSurveyStore(state => state.currentStep);
  const answers = useSurveyStore(state => state.answers);
  const goToStep = useSurveyStore(state => state.goToStep);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalSteps = sections.length;
  if (totalSteps === 0) return null;

  const progressPercent = Math.min(Math.round((currentStep / totalSteps) * 100) + 10, 100);
  const sectionName = sections[currentStep]?.name ?? '';
  const remainingMinutes = Math.max(1, Math.round((totalSteps - currentStep) * 1.3));
  const answeredCount = countAnswered(answers);

  return (
    <div className={`progress-bar${isScrolled ? ' scrolled' : ''}`}>
      <div className="progress-inner">
        <div className="prog-row">
          <span className="prog-section">
            Abschnitt {currentStep + 1} von {totalSteps} — {sectionName}
          </span>
          <div className="prog-meta">
            <span>{answeredCount} beantwortet</span>
            <span className="prog-sep">·</span>
            <span>~{remainingMinutes} Min.</span>
          </div>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="prog-dots">
          {sections.map((section, index) => {
            const stateClass =
              index < currentStep ? ' done' : index === currentStep ? ' active' : '';
            return (
              <div
                key={section.id}
                className={`prog-dot${stateClass}`}
                onClick={() => goToStep(index)}
                role="button"
                tabIndex={0}
                aria-label={`Zu Abschnitt ${index + 1}: ${section.name}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
