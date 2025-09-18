// src/components/dashboard/charts/AgeDistribution.tsx
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
  getAgeDistribution,
  chartHelpers,
} from '../../../services/reportService';
import type { ReportFilters } from '../../../types/Report';

type AgeDistributionBarData = ChartData<'bar', number[], string>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AgeDistribution({
  filters,
}: {
  filters?: ReportFilters;
}) {
  const [data, setData] = useState<AgeDistributionBarData | null>(null);

  useEffect(() => {
    (async () => {
      const rows = await getAgeDistribution(filters);
      const ds: AgeDistributionBarData = chartHelpers.toBar(
        { labels: rows.map((r) => r.bucket), data: rows.map((r) => r.count) },
        'OTs'
      );
      setData(ds);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Distribución Edad de OTs</h3>
      <Bar
        data={data}
        options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
      />
    </div>
  );
}
