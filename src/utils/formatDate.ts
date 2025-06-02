import { toZonedTime } from "date-fns-tz";

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

export const formatDateTimeLocal = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
};

/**
 * Retorna la fecha actual en zona horaria específica como ISO string completo (con zona local aplicada)
 * @param tz Ej: "America/La_Paz", "America/Santo_Domingo"
 */
export const getNowInTimezone = (tz: string = "America/Santo_Domingo"): string => {
  const now = new Date();
  const zoned = toZonedTime(now, tz);
  return zoned.toISOString();
};