// src/components/dashboard/kanban/KanbanFiltersBar.tsx
import FilterBar from '../../ui/filters/FilterBar';
import { kanbanFilters } from '../../../features/tickets/kanbanFilters';

export default function KanbanFiltersBar({
  onApply,
}: {
  onApply: (values: Record<string, unknown>) => void;
}) {
  return <FilterBar schema={kanbanFilters} onApply={onApply} sticky />;
}
