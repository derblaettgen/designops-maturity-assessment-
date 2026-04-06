/**
 * dashboard.js — results rendering, Chart.js initialisation, ROI calculation.
 * Uses <template> elements from index.html — zero HTML strings.
 * Reads state (read-only). Mutates nothing outside its own scope.
 */

import { state, getScores } from './engine.js';

// ===== TEMPLATE HELPER =====

function cloneTemplate(id) {
  const tpl = document.getElementById(id);
  return tpl.content.firstElementChild.cloneNode(true);
}

function cloneTemplateAll(id) {
  const tpl = document.getElementById(id);
  return tpl.content.cloneNode(true);
}

// ===== EXPORTED ENTRY POINT =====

export function renderDashboard() {
  const scores  = getScores();
  const avg     = scores.reduce((a, d) => a + d.score, 0) / scores.length;
  const costs   = extractCosts();
  const { wasteNow, saving } = calcWaste(scores, costs);

  const db = document.getElementById('dashboard');
  db.classList.add('active');

  // Clone the main dashboard skeleton (multiple sibling nodes)
  db.appendChild(cloneTemplateAll('tpl-dashboard'));

  // Fill KPIs
  fillKPIs(db.querySelector('#kpiContainer'), avg, wasteNow, saving);

  // Fill ROI highlight
  const roiSaving = db.querySelector('#roiSaving');
  const roiBasis  = db.querySelector('#roiBasis');
  roiSaving.textContent = fmtK(saving);
  roiBasis.textContent  = `Basierend auf ${costs.nD} Designer:innen, ${costs.nDv} Developers, ${costs.nP} PMs · Stundensätze: Ø ${Math.round((costs.cD + costs.cDv + costs.cP) / 3)} €`;

  // Fill ranking table
  fillRankingTable(db.querySelector('#rankBody'));

  // Fill gap analysis table
  fillGapTable(db.querySelector('#gapBody'), scores);

  // Charts init after DOM is populated
  initRadarChart(scores);
  fillDimBars(db.querySelector('#dimBars'), scores);
  initLevelsChart(costs);
  initROIChart(saving);
}

// ===== LEVEL MAPPING =====

function levelKey(v) {
  if (v < 2)   return 'critical';
  if (v < 2.5) return 'low';
  if (v < 3.5) return 'mid';
  if (v < 4.5) return 'good';
  return 'excellent';
}

function lvl(v) {
  if (v < 2)   return 'Ad-hoc';
  if (v < 2.5) return 'Emerging';
  if (v < 3.5) return 'Strukturiert';
  if (v < 4.5) return 'Skaliert';
  return 'Optimiert';
}

function badgeLevelKey(v) {
  if (v >= 4)   return 'badge-blue';
  if (v >= 3.5) return 'badge-green';
  if (v >= 2.5) return 'badge-yellow';
  if (v >= 2)   return 'badge-orange';
  return 'badge-red';
}

function priorityInfo(gap) {
  if (gap >= 2.5) return { css: 'badge-red',    text: '🔴 Kritisch' };
  if (gap >= 1.5) return { css: 'badge-orange', text: '🟠 Hoch' };
  if (gap >= 0.8) return { css: 'badge-yellow', text: '🟡 Mittel' };
  if (gap >= 0.3) return { css: 'badge-green',  text: '🟢 Niedrig' };
  return { css: 'badge-blue', text: '✅ Gut' };
}

// ===== COST EXTRACTION =====

function extractCosts() {
  const d   = state.config.costDefaults;
  const ans = state.ans;
  return {
    cD:  ans.cost_designer     ?? d.designer,
    cDv: ans.cost_developer    ?? d.developer,
    cP:  ans.cost_pm           ?? d.pm,
    nD:  ans.cost_numDesigners ?? d.numDesigners,
    nDv: ans.cost_numDevs      ?? d.numDevs,
    nP:  ans.cost_numPMs       ?? d.numPMs,
    hY:  ans.cost_hoursYear    ?? d.hoursYear
  };
}

// ===== ROI / WASTE CALCULATION =====

function wasteMult(l) {
  return Math.max(0.05, 1 - (l - 1) / 4 * 0.95);
}

function calcWaste(scores, { cD, cDv, cP, nD, nDv, nP, hY }) {
  const wf = state.config.wasteFractions;
  let wasteNow    = 0;
  let wasteTarget = 0;

  scores.forEach((s, i) => {
    const f    = wf[i];
    const base = (f.d * nD * cD + f.v * nDv * cDv + f.p * nP * cP) * hY;
    wasteNow    += base * wasteMult(s.score);
    wasteTarget += base * wasteMult(4);
  });

  return { wasteNow, wasteTarget, saving: wasteNow - wasteTarget };
}

// ===== FORMATTING HELPERS =====

function fmt(n) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

function fmtK(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' Mio €';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k €';
  return Math.round(n) + ' €';
}

// ===== KPI CARDS =====

function addKPI(container, { level, value, label, badge }) {
  const el = cloneTemplate('tpl-kpi');
  el.dataset.level = level;
  el.querySelector('.kv').textContent = value;
  el.querySelector('.kl').textContent = label;
  const ks = el.querySelector('.ks');
  if (badge) {
    ks.textContent = badge;
  } else {
    ks.remove();
  }
  container.appendChild(el);
}

function fillKPIs(container, avg, wasteNow, saving) {
  const bench = state.config.benchmark;
  const delta = avg - bench.marketAvg.avg;
  const positive = delta >= 0;

  addKPI(container, {
    level: levelKey(avg),
    value: avg.toFixed(1),
    label: 'Ihr Gesamt-Reifegrad',
    badge: lvl(avg)
  });

  addKPI(container, {
    level: 'market',
    value: bench.marketAvg.avg.toFixed(1),
    label: 'Marktdurchschnitt DACH',
    badge: lvl(bench.marketAvg.avg)
  });

  addKPI(container, {
    level: 'top',
    value: bench.topPerformer.avg.toFixed(1),
    label: 'Top-Performer',
    badge: lvl(bench.topPerformer.avg)
  });

  addKPI(container, {
    level: positive ? 'positive' : 'negative',
    value: `${positive ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}`,
    label: 'vs. Markt',
    badge: positive ? 'Überdurchschnittlich' : 'Unter Durchschnitt'
  });

  addKPI(container, {
    level: 'waste',
    value: fmtK(wasteNow),
    label: 'Verschwendung / Jahr (aktuell)',
    badge: null
  });

  addKPI(container, {
    level: 'saving',
    value: fmtK(saving),
    label: 'Einsparpotenzial / Jahr',
    badge: 'bei Reifegrad 4.0'
  });
}

// ===== RANKING TABLE =====

function fillRankingTable(tbody) {
  const bench  = state.config.benchmark;
  const sorted = Object.entries(bench.byBranch).sort((a, b) => b[1] - a[1]);
  const branch = (state.ans.d_branch ?? '').toLowerCase();

  sorted.forEach(([name, score], i) => {
    const row    = cloneTemplate('tpl-rank-row');
    const isYou  = branch && branch.includes(name.toLowerCase().split('/')[0].trim());

    if (isYou) row.classList.add('you');

    row.querySelector('.rank-pos').textContent   = i + 1;
    row.querySelector('.rank-name').innerHTML     = `${isYou ? '→ ' : ''}<strong>${name}</strong>${isYou ? ' (Ihre Branche)' : ''}`;
    row.querySelector('.rank-score').innerHTML    = `<strong>${score.toFixed(1)}</strong>`;

    const badge = row.querySelector('.badge');
    badge.dataset.level = badgeLevelKey(score).replace('badge-', '');
    badge.classList.add(badgeLevelKey(score));
    badge.textContent = lvl(score);

    tbody.appendChild(row);
  });
}

// ===== GAP ANALYSIS TABLE =====

function fillGapTable(tbody, scores) {
  const bench = state.config.benchmark;
  const gaps  = scores
    .map(s => ({
      ...s,
      top: bench.topPerformer[s.key] ?? 4.3,
      gap: (bench.topPerformer[s.key] ?? 4.3) - s.score
    }))
    .sort((a, b) => b.gap - a.gap);

  gaps.forEach((g, i) => {
    const row  = cloneTemplate('tpl-gap-row');
    const prio = priorityInfo(g.gap);

    row.querySelector('.gap-pos').textContent  = i + 1;
    row.querySelector('.gap-name').innerHTML    = `<strong>${g.name}</strong>`;

    const scoreCell = row.querySelector('.gap-score');
    scoreCell.textContent  = g.score.toFixed(1);
    scoreCell.dataset.level = levelKey(g.score);

    row.querySelector('.gap-top').textContent   = g.top.toFixed(1);
    row.querySelector('.gap-delta').textContent  = g.gap > 0 ? '-' + g.gap.toFixed(1) : '✅';

    const badge = row.querySelector('.badge');
    badge.classList.add(prio.css);
    badge.textContent = prio.text;

    tbody.appendChild(row);
  });
}

// ===== DIMENSION BARS =====

function fillDimBars(container, scores) {
  const bench = state.config.benchmark;

  scores.forEach(s => {
    const row     = cloneTemplate('tpl-dim-bar');
    const pct     = (s.score / 5) * 100;
    const topPct  = ((bench.topPerformer[s.key] ?? 4.3) / 5) * 100;
    const avgPct  = (bench.marketAvg[s.key] / 5) * 100;

    row.querySelector('.dim-lbl').textContent = s.name;
    row.querySelector('.dim-val').textContent = s.score.toFixed(1);

    const fill = row.querySelector('.dim-fill');
    fill.style.width = pct + '%';
    fill.dataset.level = levelKey(s.score);

    row.querySelector('.dim-bench').style.left     = topPct + '%';
    row.querySelector('.dim-bench-avg').style.left  = avgPct + '%';

    container.appendChild(row);
  });
}

// ===== CHART INIT =====

function initRadarChart(scores) {
  const bench = state.config.benchmark;
  const ctx   = document.getElementById('chRadar').getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: scores.map(s => s.name),
      datasets: [
        {
          label:                'Ihr Ergebnis',
          data:                 scores.map(s => s.score),
          backgroundColor:      'rgba(0,76,147,.15)',
          borderColor:          '#004C93',
          borderWidth:          2,
          pointBackgroundColor: '#004C93',
          pointRadius:          5
        },
        {
          label:           'Marktdurchschnitt',
          data:            scores.map(s => bench.marketAvg[s.key]),
          backgroundColor: 'rgba(156,163,175,.08)',
          borderColor:     '#9CA3AF',
          borderWidth:     1,
          borderDash:      [4, 4],
          pointRadius:     0
        },
        {
          label:                'Top-Performer',
          data:                 scores.map(s => bench.topPerformer[s.key]),
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

function initLevelsChart({ cD, cDv, cP, nD, nDv, nP, hY }) {
  const ctx  = document.getElementById('chLevels').getContext('2d');
  const wf   = state.config.wasteFractions;

  const wasteLvl = [1, 2, 3, 4, 5].map(l => {
    let t = 0;
    wf.forEach(f => {
      t += (f.d * nD * cD + f.v * nDv * cDv + f.p * nP * cP) * hY * wasteMult(l);
    });
    return t;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   ['Stufe 1\nAd-hoc', 'Stufe 2\nEmerging', 'Stufe 3\nStrukturiert', 'Stufe 4\nSkaliert', 'Stufe 5\nOptimiert'],
      datasets: [{
        label:           'Verschwendung / Jahr',
        data:            wasteLvl,
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
        x: { ticks: { color: '#6B7280', callback: v => fmtK(v) }, grid: { color: 'rgba(209,213,219,.2)' } },
        y: { ticks: { color: '#374151', font: { weight: '600' } }, grid: { display: false } }
      },
      plugins: {
        legend:  { display: false },
        tooltip: { callbacks: { label: c => fmt(c.raw) + ' € / Jahr' } }
      }
    }
  });
}

function initROIChart(saving) {
  const ctx = document.getElementById('chROI').getContext('2d');
  const inv = saving * 0.4;
  const yrs = [0, 1, 2, 3];

  const cumI = yrs.map(y => -inv * y);
  const cumS = yrs.map(y => {
    let s = 0;
    for (let i = 0; i < y; i++) {
      const r = i === 0 ? 0.3 : i === 1 ? 0.7 : 1;
      s += saving * 0.75 * r;
    }
    return s;
  });
  const cumN = yrs.map((_, i) => cumS[i] + cumI[i]);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Start', 'Jahr 1', 'Jahr 2', 'Jahr 3'],
      datasets: [
        {
          label:           'Kum. Investment',
          data:            cumI,
          borderColor:     '#DC2626',
          backgroundColor: 'rgba(220,38,38,.07)',
          fill: true, tension: .3, borderWidth: 2
        },
        {
          label:           'Kum. Einsparung',
          data:            cumS,
          borderColor:     '#16A34A',
          backgroundColor: 'rgba(22,163,74,.07)',
          fill: true, tension: .3, borderWidth: 2
        },
        {
          label:                'Netto-ROI',
          data:                 cumN,
          borderColor:          '#004C93',
          borderWidth:          3,
          tension:              .3,
          pointBackgroundColor: cumN.map(v => v >= 0 ? '#16A34A' : '#DC2626'),
          pointRadius:          5
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: '#6B7280', callback: v => fmtK(v) }, grid: { color: 'rgba(209,213,219,.2)' } },
        x: { ticks: { color: '#374151', font: { weight: '600' } }, grid: { display: false } }
      },
      plugins: {
        legend:  { labels: { color: '#374151', usePointStyle: true }, position: 'bottom' },
        tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(Math.round(c.raw)) + ' €' } }
      }
    }
  });
}
