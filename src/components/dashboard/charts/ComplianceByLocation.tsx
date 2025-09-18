// src/components/dashboard/charts/ComplianceByLocation.tsx
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
  getPreventiveComplianceByLocation,
  chartHelpers,
} from '../../../services/reportService';
import type { ReportFilters } from '../../../types/Report';

type ComplianceBarData = ChartData<'bar', number[], string>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ComplianceByLocation({
  filters,
}: {
  filters?: ReportFilters;
}) {
  const [data, setData] = useState<ComplianceBarData | null>(null);

  useEffect(() => {
    (async () => {
      const rows = await getPreventiveComplianceByLocation(filters);
      const ds: ComplianceBarData = chartHelpers.toBar(
        {
          labels: rows.map((r) => r.location),
          data: rows.map((r) => r.compliance),
        },
        '% Cumplimiento'
      );
      setData(ds);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">
        Cumplimiento Preventivo por Ubicación
      </h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' as const } },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 100,
              ticks: {
                callback: (value: number | string) => `${value}%`,
              },
            },
          },
        }}
      />
    </div>
  );
}
