import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { formatCompact, formatNumber } from '../../lib/format';
import { registerChartJs } from './registerChartJs';

registerChartJs();

interface RoiChartProps {
  annualSaving: number;
}

export function RoiChart({ annualSaving }: RoiChartProps) {
  const annualInvestment = annualSaving * 0.4;
  const years = [0, 1, 2, 3];

  const cumulativeInvestment = years.map(year => -annualInvestment * year);
  const cumulativeSaving = years.map(year => {
    let totalSaving = 0;
    for (let pastYear = 0; pastYear < year; pastYear++) {
      const realizationRate = pastYear === 0 ? 0.3 : pastYear === 1 ? 0.7 : 1;
      totalSaving += annualSaving * 0.75 * realizationRate;
    }
    return totalSaving;
  });
  const cumulativeNetROI = years.map(
    (_, index) => cumulativeSaving[index] + cumulativeInvestment[index]
  );

  const data: ChartData<'line'> = {
    labels: ['Start', 'Jahr 1', 'Jahr 2', 'Jahr 3'],
    datasets: [
      {
        label: 'Kum. Investment',
        data: cumulativeInvestment,
        borderColor: '#E53E3E',
        backgroundColor: 'rgba(229,62,62,.07)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'Kum. Einsparung',
        data: cumulativeSaving,
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22,163,74,.07)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'Netto-ROI',
        data: cumulativeNetROI,
        borderColor: '#004C93',
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: cumulativeNetROI.map(value => (value >= 0 ? '#16A34A' : '#E53E3E')),
        pointRadius: 5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        ticks: { color: '#718096', callback: value => formatCompact(Number(value)) },
        grid: { color: 'rgba(203,213,224,.2)' },
      },
      x: {
        ticks: { color: '#4A5568', font: { weight: 600 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#4A5568', usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: tooltipItem =>
            `${tooltipItem.dataset.label}: ${formatNumber(Math.round(Number(tooltipItem.raw)))} €`,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
