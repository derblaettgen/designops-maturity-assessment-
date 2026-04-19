import { useEffect, useState } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { countAnsweredQuestions } from '../lib/scoring';
import './ProgressBar.css';

export function ProgressBar() {
  const sections = useSurveyStore(state => state.config.sections);
  const currentStep = useSurveyStore(state => state.currentStep);
  const totalQuestions = useSurveyStore(state =>
    state.config.sections.reduce((sum, section) => sum + section.questions.length, 0)
  );
  const answeredCount = useSurveyStore(state => countAnsweredQuestions(state.config, state.answers));
  const goToStep = useSurveyStore(state => state.goToStep);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalSteps = sections.length;
  if (totalSteps === 0) return null;

  const overallPercent = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  return (
    <div className={`progress-bar${isScrolled ? ' progress-bar--scrolled' : ''}`}>
      <div className="progress-bar__inner">
        <div className="progress-bar__row">
          <span className="progress-bar__percent">{overallPercent}%</span>
          <div className="progress-bar__steps">
            {sections.map((section, index) => {
              const stateModifier =
                index < currentStep
                  ? ' progress-bar__step--done'
                  : index === currentStep
                    ? ' progress-bar__step--active'
                    : '';
              return (
                <button
                  key={section.id}
                  className={`progress-bar__step${stateModifier}`}
                  onClick={() => goToStep(index)}
                  type="button"
                  aria-label={`Zu Abschnitt ${index + 1}: ${section.name}`}
                  title={section.name}
                />
              );
            })}
          </div>
          <span className="progress-bar__meta">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}
