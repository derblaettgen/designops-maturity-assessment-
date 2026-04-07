import { useSurveyStore } from '../../store/useSurveyStore';
import type { TextareaQuestion } from '../../types/survey';
import './TextareaInput.css';

interface TextareaInputProps {
  question: TextareaQuestion;
}

export function TextareaInput({ question }: TextareaInputProps) {
  const currentAnswer = useSurveyStore(state => state.answers[question.id]);
  const setAnswer = useSurveyStore(state => state.setAnswer);

  const value = typeof currentAnswer === 'string' ? currentAnswer : '';

  return (
    <textarea
      className="tarea"
      placeholder="Ihr Kommentar (optional)…"
      value={value}
      onChange={event => setAnswer(question.id, event.target.value)}
    />
  );
}
