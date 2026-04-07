import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import type { Costs } from '../../lib/waste';
import { wasteByMaturityLevel } from '../../lib/waste';
import { formatCompact, formatNumber } from '../../lib/format';
import { useSurveyStore } from '../../store/useSurveyStore';
import { registerChartJs } from './registerChartJs';

registerChartJs();

interface WasteLevelsChartProps {
  costs: Costs;
}

export function WasteLevelsChart({ costs }: WasteLevelsChartProps) {
  const config = useSurveyStore(state => state.config);
  const wasteByLevel = wasteByMaturityLevel(config, costs);

  const data: ChartData<'bar'> = {
    labels: [
      'Stufe 1\nAd-hoc',
      'Stufe 2\nEmerging',
      'Stufe 3\nStrukturiert',
      'Stufe 4\nSkaliert',
      'Stufe 5\nOptimiert',
    ],
    datasets: [
      {
        label: 'Verschwendung / Jahr',
        data: wasteByLevel,
        backgroundColor: ['#FECACA', '#FDE68A', '#FDE68A', '#BBF7D0', '#BFDBFE'],
        borderColor: ['#E53E3E', '#D97706', '#D97706', '#16A34A', '#2563EB'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    scales: {
      x: {
        ticks: { color: '#718096', callback: value => formatCompact(Number(value)) },
        grid: { color: 'rgba(203,213,224,.2)' },
      },
      y: {
        ticks: { color: '#4A5568', font: { weight: 600 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: tooltipItem => formatNumber(Number(tooltipItem.raw)) + ' € / Jahr',
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
