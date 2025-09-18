// src/components/dashboard/charts/MttrTrendBar.tsx
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';
import { getMttrTrend, chartHelpers } from '../../../services/reportService';
import type { ReportFilters } from '../../../types/Report';

// (opcional) si ya tienes este tipo exportado desde reportService, reutilízalo
type MttrTrendPoint = { label: string; value: number };

// Dataset tipado para un bar chart con labels string y valores number
type MttrBarData = ChartData<'bar', number[], string>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MttrTrendBar({ filters }: { filters?: ReportFilters }) {
  const [data, setData] = useState<MttrBarData | null>(null);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const trend: MttrTrendPoint[] = await getMttrTrend(filters);
      const ds: MttrBarData = chartHelpers.toBar(
        { labels: trend.map((t) => t.label), data: trend.map((t) => t.value) },
        'MTTR (h)'
      );
      setData(ds);
      setCurrent(trend.length ? trend[trend.length - 1].value : null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Tendencia MTTR</h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' as const } },
          scales: { y: { beginAtZero: true } },
        }}
      />
      <p className="text-xs text-gray-500 mt-2">
        Meta: 8h {current != null ? `| Actual: ${current}h` : ''}
      </p>
    </div>
  );
}
