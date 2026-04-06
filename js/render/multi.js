export function buildMultiSelect(question, currentAnswer) {
  let html = `<div class="chips">`;
  question.options.forEach((option, index) => {
    const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(option);
    html += `<div class="chip">`;
    html += `<input type="checkbox" id="${question.id}_${index}" name="${question.id}" value="${option}" ${isChecked ? 'checked' : ''}>`;
    html += `<label for="${question.id}_${index}"><span class="chip-dot"></span>${option}</label>`;
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}
