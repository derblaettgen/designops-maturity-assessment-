/**
 * dashboard.js — results rendering, Chart.js initialisation, ROI calculation.
 * Reads state (read-only). Mutates nothing outside its own scope.
 */

import { state, getScores } from './engine.js';

// ===== EXPORTED ENTRY POINT =====

export function renderDashboard() {
  const scores  = getScores();
  const avg     = scores.reduce((a, d) => a + d.score, 0) / scores.length;
  const costs   = extractCosts();
  const { wasteNow, saving } = calcWaste(scores, costs);

  const db = document.getElementById('dashboard');
  db.classList.add('active');
  db.innerHTML = buildDashboardHTML(scores, avg, wasteNow, saving, costs);

  // Charts initialise after HTML is in the DOM
  initRadarChart(scores);
  renderDimBars(scores);
  initLevelsChart(costs);
  initROIChart(saving);
}

// ===== COST EXTRACTION =====

function extractCosts() {
  const d   = state.config.costDefaults;
  const ans = state.ans;
  return {
    cD:  ans.cost_designer    ?? d.designer,
    cDv: ans.cost_developer   ?? d.developer,
    cP:  ans.cost_pm          ?? d.pm,
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
    const f  = wf[i];
    const mN = wasteMult(s.score);
    const mT = wasteMult(4);
    const base = (f.d * nD * cD + f.v * nDv * cDv + f.p * nP * cP) * hY;
    wasteNow    += base * mN;
    wasteTarget += base * mT;
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

function col(v) {
  if (v < 2)   return '#DC2626';
  if (v < 2.5) return '#D97706';
  if (v < 3.5) return '#CA8A04';
  if (v < 4.5) return '#16A34A';
  return '#2563EB';
}

function lvl(v) {
  if (v < 2)   return 'Ad-hoc';
  if (v < 2.5) return 'Emerging';
  if (v < 3.5) return 'Strukturiert';
  if (v < 4.5) return 'Skaliert';
  return 'Optimiert';
}

// ===== HTML BUILDERS =====

function buildDashboardHTML(scores, avg, wasteNow, saving, { cD, cDv, cP, nD, nDv, nP }) {
  const bench = state.config.benchmark;
  let h = '';

  // Hero
  h += `<div class="dash-hero">
    <h2>📊 Ihr DesignOps-Ergebnis</h2>
    <p>Individuelle Auswertung mit Benchmark-Vergleich gegen Marktdurchschnitt und Top-Performer (DACH 2026)</p>
  </div>`;

  // KPIs
  h += buildKPIs(avg, wasteNow, saving, bench);

  // Main grid: radar + dim bars
  h += `<div class="dash-grid">
    <div class="dash-card"><h3>🕸️ Radar: Sie vs. Markt vs. Top-Performer</h3><canvas id="chRadar"></canvas></div>
    <div class="dash-card">
      <h3>📊 Dimensionen im Detail</h3>
      <div id="dimBars"></div>
      <div class="bench-legend">
        <span><span class="dot" style="background:var(--blue)"></span> Ihr Wert</span>
        <span><span class="dot" style="background:var(--g400)"></span> Marktdurchschnitt</span>
        <span><span class="line"></span> Top-Performer</span>
      </div>
    </div>
  </div>`;

  // Ranking table
  h += buildRankingTable();

  // Gap analysis
  h += buildGapTable(scores, bench);

  // ROI highlight
  h += `<div class="roi-highlight">
    <div class="sub">💰 Jährliches Einsparpotenzial bei Reifegrad 4.0</div>
    <div class="big">${fmtK(saving)}</div>
    <div class="sub">Basierend auf ${nD} Designer:innen, ${nDv} Developers, ${nP} PMs · Stundensätze: Ø ${Math.round((cD + cDv + cP) / 3)} €</div>
  </div>`;

  // Charts grid
  h += `<div class="dash-grid">
    <div class="dash-card"><h3>💰 Einsparung pro Reifegrad-Stufe</h3><canvas id="chLevels"></canvas></div>
    <div class="dash-card"><h3>📈 ROI über 3 Jahre (realistisches Szenario)</h3><canvas id="chROI"></canvas></div>
  </div>`;

  // CTA
  h += `<div class="dash-card" style="text-align:center;padding:36px">
    <h3 style="justify-content:center">🚀 Nächste Schritte</h3>
    <p style="color:var(--g500);font-size:.88em;line-height:1.7;max-width:500px;margin:16px auto 24px">
      Die vollständigen Studienergebnisse mit allen Branchen-Benchmarks erscheinen im <strong>Q3 2026</strong> auf adesso.de.
      Nutzen Sie Ihre individuelle Auswertung als Basis für Ihren DesignOps Business Case.
    </p>
    <a href="https://www.adesso.de" target="_blank" class="btn btn-primary">Mehr erfahren auf adesso.de →</a>
  </div>`;

  return h;
}

function buildKPIs(avg, wasteNow, saving, bench) {
  const ma  = bench.marketAvg;
  const tp  = bench.topPerformer;
  const delta = avg - ma.avg;
  const deltaPositive = delta >= 0;

  return `<div class="dash-kpis">
    <div class="dash-kpi" style="border-top-color:${col(avg)}">
      <div class="kv" style="color:${col(avg)}">${avg.toFixed(1)}</div>
      <div class="kl">Ihr Gesamt-Reifegrad</div>
      <div class="ks" style="background:${col(avg)}22;color:${col(avg)}">${lvl(avg)}</div>
    </div>
    <div class="dash-kpi" style="border-top-color:var(--g400)">
      <div class="kv" style="color:var(--g500)">${ma.avg.toFixed(1)}</div>
      <div class="kl">Marktdurchschnitt DACH</div>
      <div class="ks" style="background:var(--g100);color:var(--g500)">${lvl(ma.avg)}</div>
    </div>
    <div class="dash-kpi" style="border-top-color:var(--teal)">
      <div class="kv" style="color:var(--teal)">${tp.avg.toFixed(1)}</div>
      <div class="kl">Top-Performer</div>
      <div class="ks" style="background:#DCFCE7;color:#166534">${lvl(tp.avg)}</div>
    </div>
    <div class="dash-kpi" style="border-top-color:${deltaPositive ? 'var(--teal)' : 'var(--orange)'}">
      <div class="kv" style="color:${deltaPositive ? 'var(--teal)' : 'var(--orange)'}">${deltaPositive ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}</div>
      <div class="kl">vs. Markt</div>
      <div class="ks" style="background:${deltaPositive ? '#DCFCE7' : '#FEF3C7'};color:${deltaPositive ? '#166534' : '#92400E'}">${deltaPositive ? 'Überdurchschnittlich' : 'Unter Durchschnitt'}</div>
    </div>
    <div class="dash-kpi" style="border-top-color:var(--danger)">
      <div class="kv" style="color:var(--danger)">${fmtK(wasteNow)}</div>
      <div class="kl">Verschwendung / Jahr (aktuell)</div>
    </div>
    <div class="dash-kpi" style="border-top-color:var(--teal)">
      <div class="kv" style="color:var(--teal)">${fmtK(saving)}</div>
      <div class="kl">Einsparpotenzial / Jahr</div>
      <div class="ks" style="background:#DCFCE7;color:#166534">bei Reifegrad 4.0</div>
    </div>
  </div>`;
}

function buildRankingTable() {
  const bench  = state.config.benchmark;
  const sorted = Object.entries(bench.byBranch).sort((a, b) => b[1] - a[1]);
  const branch = state.ans.d_branch ?? '';

  let h = `<div class="dash-card" style="margin-bottom:28px">
    <h3>🏆 Branchen-Ranking: Wo stehen die Top-Performer?</h3>
    <table class="rank-table">
      <thead><tr><th>#</th><th>Branche</th><th>Ø Reifegrad</th><th>Stufe</th></tr></thead>
      <tbody>`;

  sorted.forEach(([b, v], i) => {
    // Fuzzy match: check if user's selected branch contains the benchmark key prefix
    const isYou = branch && branch.toLowerCase().includes(b.toLowerCase().split('/')[0].trim());
    const badge = badgeClass(v);
    h += `<tr class="${isYou ? 'you' : ''}">
      <td>${i + 1}</td>
      <td>${isYou ? '→ ' : ''}<strong>${b}</strong>${isYou ? ' (Ihre Branche)' : ''}</td>
      <td><strong>${v.toFixed(1)}</strong></td>
      <td><span class="badge ${badge}">${lvl(v)}</span></td>
    </tr>`;
  });

  h += `</tbody></table></div>`;
  return h;
}

function buildGapTable(scores, bench) {
  const gaps = scores.map(s => ({
    ...s,
    top: bench.topPerformer[s.key] ?? 4.3,
    gap: (bench.topPerformer[s.key] ?? 4.3) - s.score
  })).sort((a, b) => b.gap - a.gap);

  let h = `<div class="dash-card" style="margin-bottom:28px">
    <h3>📋 Gap-Analyse: Ihr Weg zu den Top-Performern</h3>
    <table class="rank-table">
      <thead><tr><th>#</th><th>Dimension</th><th>Ihr Wert</th><th>Top-Performer</th><th>Gap</th><th>Priorität</th></tr></thead>
      <tbody>`;

  gaps.forEach((g, i) => {
    const [pb, pl] = priorityBadge(g.gap);
    h += `<tr>
      <td>${i + 1}</td>
      <td><strong>${g.name}</strong></td>
      <td style="color:${col(g.score)};font-weight:700">${g.score.toFixed(1)}</td>
      <td style="color:var(--teal);font-weight:700">${g.top.toFixed(1)}</td>
      <td>${g.gap > 0 ? '-' + g.gap.toFixed(1) : '✅'}</td>
      <td><span class="badge ${pb}">${pl}</span></td>
    </tr>`;
  });

  h += `</tbody></table></div>`;
  return h;
}

function badgeClass(v) {
  if (v >= 4)   return 'badge-blue';
  if (v >= 3.5) return 'badge-green';
  if (v >= 2.5) return 'badge-yellow';
  if (v >= 2)   return 'badge-orange';
  return 'badge-red';
}

function priorityBadge(gap) {
  if (gap >= 2.5) return ['badge-red',    '🔴 Kritisch'];
  if (gap >= 1.5) return ['badge-orange', '🟠 Hoch'];
  if (gap >= 0.8) return ['badge-yellow', '🟡 Mittel'];
  if (gap >= 0.3) return ['badge-green',  '🟢 Niedrig'];
  return ['badge-blue', '✅ Gut'];
}

// ===== CHART INIT =====

function initRadarChart(scores) {
  const bench = state.config.benchmark;
  const ctx   = document.getElementById('chRadar').getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels:   scores.map(s => s.name),
      datasets: [
        {
          label:            'Ihr Ergebnis',
          data:             scores.map(s => s.score),
          backgroundColor:  'rgba(0,76,147,.15)',
          borderColor:      '#004C93',
          borderWidth:      2,
          pointBackgroundColor: '#004C93',
          pointRadius:      5
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
          label:            'Top-Performer',
          data:             scores.map(s => bench.topPerformer[s.key]),
          backgroundColor:  'rgba(0,180,160,.08)',
          borderColor:      '#00B4A0',
          borderWidth:      2,
          borderDash:       [6, 3],
          pointBackgroundColor: '#00B4A0',
          pointRadius:      3
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

function renderDimBars(scores) {
  const bench  = state.config.benchmark;
  const barsEl = document.getElementById('dimBars');

  barsEl.innerHTML = scores.map(s => {
    const pct      = (s.score / 5) * 100;
    const benchPct = (bench.marketAvg[s.key] / 5) * 100;
    const topPct   = ((bench.topPerformer[s.key] ?? 4.3) / 5) * 100;
    return `<div class="dim-row">
      <span class="dim-lbl">${s.name}</span>
      <div class="dim-track">
        <div class="dim-fill" style="width:${pct}%;background:${col(s.score)}"></div>
        <div class="dim-bench" style="left:${topPct}%" title="Top-Performer"></div>
        <div class="dim-bench-avg" style="left:${benchPct}%" title="Marktdurchschnitt"></div>
      </div>
      <span class="dim-val">${s.score.toFixed(1)}</span>
    </div>`;
  }).join('');
}

function initLevelsChart({ cD, cDv, cP, nD, nDv, nP, hY }) {
  const ctx  = document.getElementById('chLevels').getContext('2d');
  const wf   = state.config.wasteFractions;
  const lvls = [1, 2, 3, 4, 5];

  const wasteLvl = lvls.map(l => {
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
      labels:   ['Start', 'Jahr 1', 'Jahr 2', 'Jahr 3'],
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
          label:               'Netto-ROI',
          data:                cumN,
          borderColor:         '#004C93',
          borderWidth:         3,
          tension:             .3,
          pointBackgroundColor: cumN.map(v => v >= 0 ? '#16A34A' : '#DC2626'),
          pointRadius:         5
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
