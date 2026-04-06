export function buildTextarea(question, currentAnswer) {
  const value = currentAnswer ?? '';
  return `<textarea class="tarea" id="inp-${question.id}" data-qid="${question.id}" placeholder="Ihr Kommentar (optional)…">${value}</textarea>`;
}
