// src/components/dashboard/charts/TechnicianLoadBar.tsx
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
import { getTechnicianLoad } from '../../../services/reportService';
import type { ReportFilters } from '../../../types/Report';

type TechnicianLoadBarData = ChartData<'bar', number[], string>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TechnicianLoadBar({
  filters,
}: {
  filters?: ReportFilters;
}) {
  const [data, setData] = useState<TechnicianLoadBarData | null>(null);

  useEffect(() => {
    (async () => {
      const rows = await getTechnicianLoad(filters);
      const labels = rows.map((r) => r.tech);
      const load = rows.map((r) => r.hours);
      const capacity = rows.map((r) => r.capacity);

      const ds: TechnicianLoadBarData = {
        labels,
        datasets: [
          { label: 'Horas', data: load, backgroundColor: '#f59e0b' },
          { label: 'Capacidad', data: capacity, backgroundColor: '#e5e7eb' },
        ],
      };

      setData(ds);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Carga por Técnico</h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' as const } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  );
}
