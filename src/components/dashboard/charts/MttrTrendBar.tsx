import type { ReportFilters } from '../../../types/Report';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MttrTrendBar({ filters }: { filters?: ReportFilters }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-1">Tendencia MTTR</h3>
      <p className="text-sm text-gray-500">
        Sin datos por ahora. (Vista temporalmente deshabilitada)
      </p>
    </div>
  );
}
