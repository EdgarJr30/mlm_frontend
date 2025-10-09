import { useCallback, useState } from 'react';
import { toCsv, downloadCsv, type CsvHeader, type CsvRow } from '../utils/csv';

export type CsvFetcher<TFilters> = (filters: TFilters) => Promise<{
  rows: CsvRow[];
  header?: CsvHeader;
  filename?: string;
}>;

export function useCsvExport<TFilters>({
  fetcher,
  baseFilename,
}: {
  fetcher: CsvFetcher<TFilters>;
  baseFilename: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportCsv = useCallback(
    async (filters: TFilters) => {
      setExporting(true);
      setError(null);
      try {
        const { rows, header, filename } = await fetcher(filters);
        const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
        const csv = toCsv(rows, header);
        downloadCsv(filename ?? `${baseFilename}-${stamp}`, csv);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Export failed'));
        throw e;
      } finally {
        setExporting(false);
      }
    },
    [fetcher, baseFilename]
  );

  return { exporting, error, exportCsv };
}
