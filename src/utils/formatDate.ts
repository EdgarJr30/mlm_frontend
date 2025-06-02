export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};
