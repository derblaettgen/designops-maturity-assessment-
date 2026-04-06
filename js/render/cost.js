import { state } from '../engine.js';

export function buildCostInputs() {
  const defaults = state.config.costDefaults;
  const answers  = state.answers;

  let html = `<div class="cost-prefilled-badge">✓ Mit Marktdurchschnitten DACH 2026 vorausgefüllt</div>`;

  const hourlyRates = [
    { key: 'designer',   label: '🎨 Designer:in' },
    { key: 'developer',  label: '💻 Developer' },
    { key: 'pm',         label: '📋 Project Manager' },
    { key: 'researcher', label: '🔬 UX Researcher' }
  ];
  hourlyRates.forEach(rate => {
    const value = answers['cost_' + rate.key] ?? defaults[rate.key];
    html += `<div class="cost-row">
      <span class="cost-role">${rate.label}</span>
      <input class="cost-input" type="number" value="${value}" min="0" id="ci_${rate.key}" data-costkey="${rate.key}">
      <span class="cost-unit">€ / Stunde</span>
    </div>`;
  });

  html += `<div class="cost-divider">`;
  const teamCounts = [
    { key: 'numDesigners', label: '👥 Anz. Designer:innen' },
    { key: 'numDevs',      label: '💻 Anz. Developers (mit Design)' },
    { key: 'numPMs',       label: '📋 Anz. Project Manager' },
    { key: 'hoursYear',    label: '📅 Arbeitsstunden / Jahr' }
  ];
  teamCounts.forEach(item => {
    const value = answers['cost_' + item.key] ?? defaults[item.key];
    html += `<div class="cost-row">
      <span class="cost-role">${item.label}</span>
      <input class="cost-input" type="number" value="${value}" min="0" id="ci_${item.key}" data-costkey="${item.key}">
      <span class="cost-unit"></span>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="cost-note">💡 Tipp: Alle Werte basieren auf Marktdaten für die DACH-Region 2026. Wenn Sie die genauen Zahlen nicht kennen, können Sie die Vorgaben einfach übernehmen.</div>`;

  return html;
}
