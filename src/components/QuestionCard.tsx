import { useEffect, useRef } from 'react';
import { useSurveyStore } from '../store/useSurveyStore';
import { isAnswered } from '../lib/scoring';
import type { Question } from '../types/survey';
import { registerQuestionCard, unregisterQuestionCard } from './questionCardRefs';
import './QuestionCard.css';
import { LikertScale } from './inputs/LikertScale';
import { SelectInput } from './inputs/SelectInput';
import { MultiSelect } from './inputs/MultiSelect';
import { TextareaInput } from './inputs/TextareaInput';
import { CostBlock } from './inputs/CostBlock';

interface QuestionCardProps {
  question: Question;
}

function renderInput(question: Question) {
  switch (question.type) {
    case 'likert':   return <LikertScale question={question} />;
    case 'select':   return <SelectInput question={question} />;
    case 'multi':    return <MultiSelect question={question} />;
    case 'textarea': return <TextareaInput question={question} />;
    case 'cost':     return <CostBlock />;
    default: {
      const exhaustiveCheck: never = question;
      return exhaustiveCheck;
    }
  }
}

export function QuestionCard({ question }: QuestionCardProps) {
  const answer = useSurveyStore(state => state.answers[question.id]);
  const hasError = useSurveyStore(state => state.failedIds.includes(question.id));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    registerQuestionCard(question.id, cardRef.current);
    return () => unregisterQuestionCard(question.id);
  }, [question.id]);

  const className = [
    'question-card',
    isAnswered(answer) ? 'question-card--answered' : '',
    hasError ? 'question-card--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} ref={cardRef}>
      <div className="question-card__check">✓</div>
      <div className="question-card__id">
        {question.id.toUpperCase()}
        {question.req && <span className="question-card__required"> *</span>}
      </div>
      <div className="question-card__text">{question.text}</div>
      {question.hint && <div className="question-card__hint">{question.hint}</div>}
      {renderInput(question)}
    </div>
  );
}
