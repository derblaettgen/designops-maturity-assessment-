import { useSurveyStore } from '../../store/useSurveyStore';
import { LIKERT_SCALE } from '../../lib/constants';
import type { LikertQuestion } from '../../types/survey';
import './LikertScale.css';

interface LikertScaleProps {
  question: LikertQuestion;
}

export function LikertScale({ question }: LikertScaleProps) {
  const labels = useSurveyStore(state => state.config.likertLabels);
  const currentAnswer = useSurveyStore(state => state.answers[question.id]);
  const setAnswer = useSurveyStore(state => state.setAnswer);

  const firstLabel = labels[0];
  const lastLabel = labels[labels.length - 1];

  return (
    <div className="likert">
      <div className="likert__endpoints">
        <span className="likert__endpoint">{firstLabel}</span>
        <span className="likert__endpoint">{lastLabel}</span>
      </div>
      <div className="likert__options">
        {LIKERT_SCALE.map(scale => {
          const inputId = `${question.id}_${scale}`;
          return (
            <div className="likert__option" key={scale}>
              <input
                type="radio"
                name={question.id}
                id={inputId}
                value={scale}
                checked={Number(currentAnswer) === scale}
                onChange={() => setAnswer(question.id, scale)}
              />
              <label htmlFor={inputId}>
                {scale}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
