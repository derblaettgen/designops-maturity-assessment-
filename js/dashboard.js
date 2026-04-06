import { state, getAllDimensionScores } from './engine.js';

// ===== TEMPLATE HELPERS =====

function cloneTemplate(templateId) {
  const template = document.getElementById(templateId);
  return template.content.firstElementChild.cloneNode(true);
}

function cloneFullTemplate(templateId) {
  const template = document.getElementById(templateId);
  return template.content.cloneNode(true);
}

// ===== EXPORTED ENTRY POINT =====

export function renderDashboard() {
  const dimensionScores = getAllDimensionScores();
  const averageScore    = dimensionScores.reduce((sum, dimension) => sum + dimension.score, 0) / dimensionScores.length;
  const costs           = extractCosts();
  const { currentWaste, annualSaving } = calculateWaste(dimensionScores, costs);

  const dashboardContainer = document.getElementById('dashboard');
  dashboardContainer.classList.add('active');
  dashboardContainer.appendChild(cloneFullTemplate('tpl-dashboard'));

  fillKPICards(dashboardContainer.querySelector('#kpiContainer'), averageScore, currentWaste, annualSaving);

  const savingDisplay = dashboardContainer.querySelector('#roiSaving');
  const basisDisplay  = dashboardContainer.querySelector('#roiBasis');
  savingDisplay.textContent = formatCompact(annualSaving);
  basisDisplay.textContent  = `Basierend auf ${costs.designerCount} Designer:innen, ${costs.developerCount} Developers, ${costs.pmCount} PMs · Stundensätze: Ø ${Math.round((costs.designerRate + costs.developerRate + costs.pmRate) / 3)} €`;

  fillRankingTable(dashboardContainer.querySelector('#rankBody'));
  fillGapAnalysisTable(dashboardContainer.querySelector('#gapBody'), dimensionScores);

  initRadarChart(dimensionScores);
  fillDimensionBars(dashboardContainer.querySelector('#dimBars'), dimensionScores);
  initWasteLevelsChart(costs);
  initROIChart(annualSaving);
}

// ===== MATURITY LEVEL MAPPING =====

function maturityLevelKey(score) {
  if (score < 2)   return 'critical';
  if (score < 2.5) return 'low';
  if (score < 3.5) return 'mid';
  if (score < 4.5) return 'good';
  return 'excellent';
}

function maturityLabel(score) {
  if (score < 2)   return 'Ad-hoc';
  if (score < 2.5) return 'Emerging';
  if (score < 3.5) return 'Strukturiert';
  if (score < 4.5) return 'Skaliert';
  return 'Optimiert';
}

function scoreBadgeClass(score) {
  if (score >= 4)   return 'badge-blue';
  if (score >= 3.5) return 'badge-green';
  if (score >= 2.5) return 'badge-yellow';
  if (score >= 2)   return 'badge-orange';
  return 'badge-red';
}

function gapPriorityInfo(gapSize) {
  if (gapSize >= 2.5) return { cssClass: 'badge-red',    label: '🔴 Kritisch' };
  if (gapSize >= 1.5) return { cssClass: 'badge-orange', label: '🟠 Hoch' };
  if (gapSize >= 0.8) return { cssClass: 'badge-yellow', label: '🟡 Mittel' };
  if (gapSize >= 0.3) return { cssClass: 'badge-green',  label: '🟢 Niedrig' };
  return { cssClass: 'badge-blue', label: '✅ Gut' };
}

// ===== COST EXTRACTION =====

function extractCosts() {
  const defaults = state.config.costDefaults;
  const answers  = state.answers;
  return {
    designerRate:   answers.cost_designer     ?? defaults.designer,
    developerRate:  answers.cost_developer    ?? defaults.developer,
    pmRate:         answers.cost_pm           ?? defaults.pm,
    designerCount:  answers.cost_numDesigners ?? defaults.numDesigners,
    developerCount: answers.cost_numDevs      ?? defaults.numDevs,
    pmCount:        answers.cost_numPMs       ?? defaults.numPMs,
    hoursPerYear:   answers.cost_hoursYear    ?? defaults.hoursYear
  };
}

// ===== WASTE / ROI CALCULATION =====

function wasteMultiplier(maturityLevel) {
  return Math.max(0.05, 1 - (maturityLevel - 1) / 4 * 0.95);
}

function calculateWaste(dimensionScores, { designerRate, developerRate, pmRate, designerCount, developerCount, pmCount, hoursPerYear }) {
  const wasteFractions = state.config.wasteFractions;
  let currentWaste  = 0;
  let targetWaste   = 0;

  dimensionScores.forEach((dimension, index) => {
    const fraction     = wasteFractions[index];
    const annualBase   = (fraction.d * designerCount * designerRate
                        + fraction.v * developerCount * developerRate
                        + fraction.p * pmCount * pmRate)
                        * hoursPerYear;
    currentWaste  += annualBase * wasteMultiplier(dimension.score);
    targetWaste   += annualBase * wasteMultiplier(4);
  });

  return { currentWaste, targetWaste, annualSaving: currentWaste - targetWaste };
}

// ===== FORMATTING =====

function formatNumber(number) {
  return number.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

function formatCompact(number) {
  if (number >= 1e6) return (number / 1e6).toFixed(1) + ' Mio €';
  if (number >= 1e3) return Math.round(number / 1e3) + 'k €';
  return Math.round(number) + ' €';
}

// ===== KPI CARDS =====

function appendKPICard(container, { level, value, label, badge }) {
  const card       = cloneTemplate('tpl-kpi');
  card.dataset.level = level;
  card.querySelector('.kv').textContent = value;
  card.querySelector('.kl').textContent = label;
  const badgeElement = card.querySelector('.ks');
  if (badge) {
    badgeElement.textContent = badge;
  } else {
    badgeElement.remove();
  }
  container.appendChild(card);
}

function fillKPICards(container, averageScore, currentWaste, annualSaving) {
  const benchmark = state.config.benchmark;
  const marketDelta     = averageScore - benchmark.marketAvg.avg;
  const isAboveAverage  = marketDelta >= 0;

  appendKPICard(container, {
    level: maturityLevelKey(averageScore),
    value: averageScore.toFixed(1),
    label: 'Ihr Gesamt-Reifegrad',
    badge: maturityLabel(averageScore)
  });

  appendKPICard(container, {
    level: 'market',
    value: benchmark.marketAvg.avg.toFixed(1),
    label: 'Marktdurchschnitt DACH',
    badge: maturityLabel(benchmark.marketAvg.avg)
  });

  appendKPICard(container, {
    level: 'top',
    value: benchmark.topPerformer.avg.toFixed(1),
    label: 'Top-Performer',
    badge: maturityLabel(benchmark.topPerformer.avg)
  });

  appendKPICard(container, {
    level: isAboveAverage ? 'positive' : 'negative',
    value: `${isAboveAverage ? '▲' : '▼'} ${Math.abs(marketDelta).toFixed(1)}`,
    label: 'vs. Markt',
    badge: isAboveAverage ? 'Überdurchschnittlich' : 'Unter Durchschnitt'
  });

  appendKPICard(container, {
    level: 'waste',
    value: formatCompact(currentWaste),
    label: 'Verschwendung / Jahr (aktuell)',
    badge: null
  });

  appendKPICard(container, {
    level: 'saving',
    value: formatCompact(annualSaving),
    label: 'Einsparpotenzial / Jahr',
    badge: 'bei Reifegrad 4.0'
  });
}

// ===== RANKING TABLE =====

function fillRankingTable(tableBody) {
  const benchmark     = state.config.benchmark;
  const sortedBranches = Object.entries(benchmark.byBranch).sort((a, b) => b[1] - a[1]);
  const userBranch     = (state.answers.d_branch ?? '').toLowerCase();

  sortedBranches.forEach(([branchName, branchScore], position) => {
    const row         = cloneTemplate('tpl-rank-row');
    const isUserBranch = userBranch && userBranch.includes(branchName.toLowerCase().split('/')[0].trim());

    if (isUserBranch) row.classList.add('you');

    row.querySelector('.rank-pos').textContent   = position + 1;
    row.querySelector('.rank-name').innerHTML     = `${isUserBranch ? '→ ' : ''}<strong>${branchName}</strong>${isUserBranch ? ' (Ihre Branche)' : ''}`;
    row.querySelector('.rank-score').innerHTML    = `<strong>${branchScore.toFixed(1)}</strong>`;

    const badge = row.querySelector('.badge');
    badge.classList.add(scoreBadgeClass(branchScore));
    badge.textContent = maturityLabel(branchScore);

    tableBody.appendChild(row);
  });
}

// ===== GAP ANALYSIS TABLE =====

function fillGapAnalysisTable(tableBody, dimensionScores) {
  const benchmark   = state.config.benchmark;
  const gapAnalysis = dimensionScores
    .map(dimension => ({
      ...dimension,
      topPerformerScore: benchmark.topPerformer[dimension.key] ?? 4.3,
      gapToTop:          (benchmark.topPerformer[dimension.key] ?? 4.3) - dimension.score
    }))
    .sort((a, b) => b.gapToTop - a.gapToTop);

  gapAnalysis.forEach((gap, position) => {
    const row      = cloneTemplate('tpl-gap-row');
    const priority = gapPriorityInfo(gap.gapToTop);

    row.querySelector('.gap-pos').textContent  = position + 1;
    row.querySelector('.gap-name').innerHTML    = `<strong>${gap.name}</strong>`;

    const scoreCell         = row.querySelector('.gap-score');
    scoreCell.textContent   = gap.score.toFixed(1);
    scoreCell.dataset.level = maturityLevelKey(gap.score);

    row.querySelector('.gap-top').textContent   = gap.topPerformerScore.toFixed(1);
    row.querySelector('.gap-delta').textContent  = gap.gapToTop > 0 ? '-' + gap.gapToTop.toFixed(1) : '✅';

    const badge = row.querySelector('.badge');
    badge.classList.add(priority.cssClass);
    badge.textContent = priority.label;

    tableBody.appendChild(row);
  });
}

// ===== DIMENSION BARS =====

function fillDimensionBars(container, dimensionScores) {
  const benchmark = state.config.benchmark;

  dimensionScores.forEach(dimension => {
    const row                 = cloneTemplate('tpl-dim-bar');
    const scorePercent        = (dimension.score / 5) * 100;
    const topPerformerPercent = ((benchmark.topPerformer[dimension.key] ?? 4.3) / 5) * 100;
    const marketAvgPercent    = (benchmark.marketAvg[dimension.key] / 5) * 100;

    row.querySelector('.dim-lbl').textContent = dimension.name;
    row.querySelector('.dim-val').textContent = dimension.score.toFixed(1);

    const fillBar          = row.querySelector('.dim-fill');
    fillBar.style.width    = scorePercent + '%';
    fillBar.dataset.level  = maturityLevelKey(dimension.score);

    row.querySelector('.dim-bench').style.left     = topPerformerPercent + '%';
    row.querySelector('.dim-bench-avg').style.left  = marketAvgPercent + '%';

    container.appendChild(row);
  });
}

// ===== CHART INITIALISATION =====

function initRadarChart(dimensionScores) {
  const benchmark    = state.config.benchmark;
  const canvasContext = document.getElementById('chRadar').getContext('2d');

  new Chart(canvasContext, {
    type: 'radar',
    data: {
      labels: dimensionScores.map(dimension => dimension.name),
      datasets: [
        {
          label:                'Ihr Ergebnis',
          data:                 dimensionScores.map(dimension => dimension.score),
          backgroundColor:      'rgba(0,76,147,.15)',
          borderColor:          '#004C93',
          borderWidth:          2,
          pointBackgroundColor: '#004C93',
          pointRadius:          5
        },
        {
          label:           'Marktdurchschnitt',
          data:            dimensionScores.map(dimension => benchmark.marketAvg[dimension.key]),
          backgroundColor: 'rgba(156,163,175,.08)',
          borderColor:     '#9CA3AF',
          borderWidth:     1,
          borderDash:      [4, 4],
          pointRadius:     0
        },
        {
          label:                'Top-Performer',
          data:                 dimensionScores.map(dimension => benchmark.topPerformer[dimension.key]),
          backgroundColor:      'rgba(0,180,160,.08)',
          borderColor:          '#00B4A0',
          borderWidth:          2,
          borderDash:           [6, 3],
          pointBackgroundColor: '#00B4A0',
          pointRadius:          3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks:       { stepSize: 1, color: '#6B7280', backdropColor: 'transparent', font: { size: 10 } },
          grid:        { color: 'rgba(209,213,219,.4)' },
          angleLines:  { color: 'rgba(209,213,219,.3)' },
          pointLabels: { color: '#374151', font: { size: 11, weight: '600' } }
        }
      },
      plugins: {
        legend: { labels: { color: '#374151', padding: 14, usePointStyle: true }, position: 'bottom' }
      }
    }
  });
}

function initWasteLevelsChart({ designerRate, developerRate, pmRate, designerCount, developerCount, pmCount, hoursPerYear }) {
  const canvasContext  = document.getElementById('chLevels').getContext('2d');
  const wasteFractions = state.config.wasteFractions;

  const wasteByLevel = [1, 2, 3, 4, 5].map(level => {
    let totalWaste = 0;
    wasteFractions.forEach(fraction => {
      totalWaste += (fraction.d * designerCount * designerRate
                   + fraction.v * developerCount * developerRate
                   + fraction.p * pmCount * pmRate)
                   * hoursPerYear * wasteMultiplier(level);
    });
    return totalWaste;
  });

  new Chart(canvasContext, {
    type: 'bar',
    data: {
      labels:   ['Stufe 1\nAd-hoc', 'Stufe 2\nEmerging', 'Stufe 3\nStrukturiert', 'Stufe 4\nSkaliert', 'Stufe 5\nOptimiert'],
      datasets: [{
        label:           'Verschwendung / Jahr',
        data:            wasteByLevel,
        backgroundColor: ['#FECACA', '#FDE68A', '#FDE68A', '#BBF7D0', '#BFDBFE'],
        borderColor:     ['#DC2626', '#D97706', '#D97706', '#16A34A', '#2563EB'],
        borderWidth:     2,
        borderRadius:    6
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: '#6B7280', callback: value => formatCompact(value) }, grid: { color: 'rgba(209,213,219,.2)' } },
        y: { ticks: { color: '#374151', font: { weight: '600' } }, grid: { display: false } }
      },
      plugins: {
        legend:  { display: false },
        tooltip: { callbacks: { label: tooltipItem => formatNumber(tooltipItem.raw) + ' € / Jahr' } }
      }
    }
  });
}

function initROIChart(annualSaving) {
  const canvasContext     = document.getElementById('chROI').getContext('2d');
  const annualInvestment  = annualSaving * 0.4;
  const years             = [0, 1, 2, 3];

  const cumulativeInvestment = years.map(year => -annualInvestment * year);
  const cumulativeSaving     = years.map(year => {
    let totalSaving = 0;
    for (let pastYear = 0; pastYear < year; pastYear++) {
      const realizationRate = pastYear === 0 ? 0.3 : pastYear === 1 ? 0.7 : 1;
      totalSaving += annualSaving * 0.75 * realizationRate;
    }
    return totalSaving;
  });
  const cumulativeNetROI = years.map((_, index) => cumulativeSaving[index] + cumulativeInvestment[index]);

  new Chart(canvasContext, {
    type: 'line',
    data: {
      labels: ['Start', 'Jahr 1', 'Jahr 2', 'Jahr 3'],
      datasets: [
        {
          label:           'Kum. Investment',
          data:            cumulativeInvestment,
          borderColor:     '#DC2626',
          backgroundColor: 'rgba(220,38,38,.07)',
          fill: true, tension: .3, borderWidth: 2
        },
        {
          label:           'Kum. Einsparung',
          data:            cumulativeSaving,
          borderColor:     '#16A34A',
          backgroundColor: 'rgba(22,163,74,.07)',
          fill: true, tension: .3, borderWidth: 2
        },
        {
          label:                'Netto-ROI',
          data:                 cumulativeNetROI,
          borderColor:          '#004C93',
          borderWidth:          3,
          tension:              .3,
          pointBackgroundColor: cumulativeNetROI.map(value => value >= 0 ? '#16A34A' : '#DC2626'),
          pointRadius:          5
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: '#6B7280', callback: value => formatCompact(value) }, grid: { color: 'rgba(209,213,219,.2)' } },
        x: { ticks: { color: '#374151', font: { weight: '600' } }, grid: { display: false } }
      },
      plugins: {
        legend:  { labels: { color: '#374151', usePointStyle: true }, position: 'bottom' },
        tooltip: { callbacks: { label: tooltipItem => tooltipItem.dataset.label + ': ' + formatNumber(Math.round(tooltipItem.raw)) + ' €' } }
      }
    }
  });
}
