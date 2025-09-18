// src/components/dashboard/charts/PreventiveVsCorrective.tsx
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
import {
  getPreventiveVsCorrective,
  chartHelpers,
} from '../../../services/reportService';
import type { ReportFilters } from '../../../types/Report';

type PreventiveVsCorrectiveData = ChartData<'bar', number[], string>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PreventiveVsCorrective({
  filters,
}: {
  filters?: ReportFilters;
}) {
  const [data, setData] = useState<PreventiveVsCorrectiveData | null>(null);

  useEffect(() => {
    (async () => {
      const months = await getPreventiveVsCorrective(filters);
      const ds: PreventiveVsCorrectiveData = chartHelpers.toStackedBars(months);
      setData(ds);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Preventivo vs Correctivo</h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' as const } },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true },
          },
        }}
      />
    </div>
  );
}
