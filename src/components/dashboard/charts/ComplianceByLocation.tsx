import type { ReportFilters } from '../../../types/Report';

export default function ComplianceByLocation({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filters,
}: {
  filters?: ReportFilters;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-1">
        Cumplimiento Preventivo por Ubicación
      </h3>
      <p className="text-sm text-gray-500">
        Sin datos por ahora. (Vista temporalmente deshabilitada)
      </p>
    </div>
  );
}
