import ExportCsvButton from '../../common/ExportCsvButton';
import { useCsvExport } from '../../../hooks/useCsvExport';
import {
  fetchTicketsCsv,
  type WorkOrdersFilters,
} from '../../../services/exports/ticketsExportService';

type Props = {
  filters: WorkOrdersFilters;
  pillBtnClassName?: string;
};

export default function ExportTicketsCsvAdapter({
  filters,
  pillBtnClassName,
}: Props) {
  const { exportCsv, exporting } = useCsvExport<WorkOrdersFilters>({
    fetcher: fetchTicketsCsv,
    baseFilename: 'tickets',
  });

  return (
    <ExportCsvButton
      onExport={() => exportCsv(filters)}
      disabled={exporting}
      label="Exportar"
      className={
        pillBtnClassName ??
        ' items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-60 cursor-pointer'
      }
    />
  );
}
