import { useSurveyStore } from '../../store/useSurveyStore';
import type { MultiQuestion } from '../../types/survey';
import './MultiSelect.css';

interface MultiSelectProps {
  question: MultiQuestion;
}

export function MultiSelect({ question }: MultiSelectProps) {
  const currentAnswer = useSurveyStore(state => state.answers[question.id]);
  const setMultiAnswer = useSurveyStore(state => state.setMultiAnswer);

  const selected = Array.isArray(currentAnswer) ? currentAnswer : [];

  const toggleOption = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    setMultiAnswer(question.id, next);
  };

  return (
    <div className="chips">
      {question.options.map((option, index) => {
        const inputId = `${question.id}_${index}`;
        return (
          <div className="chip" key={option}>
            <input
              type="checkbox"
              id={inputId}
              name={question.id}
              value={option}
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
            />
            <label htmlFor={inputId}>
              <span className="chip-dot" />
              {option}
            </label>
          </div>
        );
      })}
    </div>
  );
}
