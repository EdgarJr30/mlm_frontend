const TICKETS_KEY = "easy_maint_tickets";

export function getTicketsFromStorage() {
  const raw = localStorage.getItem(TICKETS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTicketsToStorage(tickets: unknown[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}
