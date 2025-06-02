export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

export const formatDateTimeLocal = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
};