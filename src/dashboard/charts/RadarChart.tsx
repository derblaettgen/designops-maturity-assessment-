import { Radar } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import type { DimensionWithScore } from '../../lib/scoring';
import { registerChartJs } from './registerChartJs';

registerChartJs();

interface RadarChartProps {
  dimensionScores: DimensionWithScore[];
}

export function RadarChart({ dimensionScores }: RadarChartProps) {
  const data: ChartData<'radar'> = {
    labels: dimensionScores.map(dimension => dimension.name),
    datasets: [
      {
        label: 'Ihr Ergebnis',
        data: dimensionScores.map(dimension => dimension.score),
        backgroundColor: 'rgba(0,76,147,.15)',
        borderColor: '#004C93',
        borderWidth: 2,
        pointBackgroundColor: '#004C93',
        pointRadius: 5,
      },
      {
        label: 'Marktdurchschnitt',
        data: dimensionScores.map(dimension => dimension.marketAvg),
        backgroundColor: 'rgba(160,174,192,.08)',
        borderColor: '#A0AEC0',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      },
      {
        label: 'Top-Performer',
        data: dimensionScores.map(dimension => dimension.topPerformer),
        backgroundColor: 'rgba(0,180,160,.08)',
        borderColor: '#00B4A0',
        borderWidth: 2,
        borderDash: [6, 3],
        pointBackgroundColor: '#00B4A0',
        pointRadius: 3,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, color: '#718096', backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: 'rgba(203,213,224,.4)' },
        angleLines: { color: 'rgba(203,213,224,.3)' },
        pointLabels: { color: '#4A5568', font: { size: 11, weight: 600 } },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#4A5568', padding: 14, usePointStyle: true },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
