// src/components/dashboard/inbox/InboxFiltersBar.tsx
import FilterBar from '../../ui/filters/FilterBar';
import { inboxFilters } from '../../../features/tickets/inboxFilters';

export default function InboxFiltersBar({
  onApply,
}: {
  onApply: (values: Record<string, unknown>) => void;
}) {
  return <FilterBar schema={inboxFilters} onApply={onApply} sticky />;
}
