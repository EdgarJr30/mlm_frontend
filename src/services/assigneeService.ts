import { supabase } from '../lib/supabaseClient';
import type { Assignee, AssigneeSection } from '../types/Assignee';

export async function getActiveAssignees(): Promise<Assignee[]> {
const { data, error } = await supabase
.from('assignees')
.select('id, name, last_name, section, is_active, user_id, email, phone')
.eq('is_active', true)
.order('section', { ascending: true })
.order('name', { ascending: true });

if (error) throw new Error(error.message);
return (data ?? []) as Assignee[];
}

export function groupBySection(list: Assignee[]): Record<AssigneeSection, Assignee[]> {
const sections: AssigneeSection[] = ['SIN ASIGNAR', 'Internos', 'TERCEROS', 'OTROS'];
const grouped = Object.fromEntries(sections.map(s => [s, [] as Assignee[]])) as Record<AssigneeSection, Assignee[]>;
for (const a of list) {
const key = sections.includes(a.section) ? a.section : 'OTROS';
grouped[key].push(a);
}
return grouped;
}

export function makeAssigneeMap(list: Assignee[]): Record<number, Assignee> {
const map: Record<number, Assignee> = {};
for (const a of list) map[a.id] = a;
return map;
}

export function formatAssigneeFullName(a?: Assignee): string {
if (!a) return '<< SIN ASIGNAR >>';
return `${a.name} ${a.last_name}`.trim();
}

export function assigneeInitials(a?: Assignee): string {
if (!a) return 'SA';
const parts = `${a.name} ${a.last_name}`.trim().split(/\s+/);
const i1 = parts[0]?.[0] ?? '';
const i2 = parts[1]?.[0] ?? '';
return `${i1}${i2}`.toUpperCase() || 'SA';
}