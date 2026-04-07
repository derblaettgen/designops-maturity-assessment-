import { useSurveyStore } from '../../store/useSurveyStore';
import type { LikertQuestion } from '../../types/survey';
import './LikertScale.css';

interface LikertScaleProps {
  question: LikertQuestion;
}

export function LikertScale({ question }: LikertScaleProps) {
  const labels = useSurveyStore(state => state.config.likertLabels);
  const currentAnswer = useSurveyStore(state => state.answers[question.id]);
  const setAnswer = useSurveyStore(state => state.setAnswer);

  return (
    <div className="likert">
      {[1, 2, 3, 4, 5].map(scale => {
        const inputId = `${question.id}_${scale}`;
        return (
          <div className="opt" key={scale}>
            <input
              type="radio"
              name={question.id}
              id={inputId}
              value={scale}
              checked={Number(currentAnswer) === scale}
              onChange={() => setAnswer(question.id, scale)}
            />
            <label htmlFor={inputId}>
              <span className="num">{scale}</span>
              <span className="lbl">{labels[scale - 1]}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
