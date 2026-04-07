const questionCardNodes = new Map<string, HTMLElement>();

export function registerQuestionCard(questionId: string, node: HTMLElement): void {
  questionCardNodes.set(questionId, node);
}

export function unregisterQuestionCard(questionId: string): void {
  questionCardNodes.delete(questionId);
}

export function scrollToQuestionCard(questionId: string): void {
  questionCardNodes.get(questionId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
