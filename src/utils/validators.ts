
export const MAX_TITLE_LENGTH = 30
export const MAX_DESCRIPTION_LENGTH = 60
export const MAX_REQUESTER_LENGTH = 30
export const MAX_EMAIL_LENGTH = 30
export const MAX_PHONE_LENGTH = 20
export const MAX_DETAILS_LENGTH = 120

export function validateTitle(title: string): string | null {
  if (!title.trim()) return "El título es obligatorio."
  if (title.length > MAX_TITLE_LENGTH) return `El título no puede superar los ${MAX_TITLE_LENGTH} caracteres.`
  return null
}

export function validateDescription(description: string): string | null {
  if (!description.trim()) return "La descripción es obligatoria."
  if (description.length > MAX_DESCRIPTION_LENGTH) return `La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`
  return null
}

export function validateRequester(requester: string): string | null {
  if (!requester.trim()) return "El nombre del solicitante es obligatorio."
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s']+$/.test(requester)) return "El nombre solo debe contener letras."
  if (!requester.trim().includes(" ")) return "Escribe el nombre completo (nombre y apellido)."
  if (requester.length > MAX_REQUESTER_LENGTH) return `El nombre no puede superar los ${MAX_REQUESTER_LENGTH} caracteres.`
  return null
}

export function validateLocation(location: string): string | null {
  if (!location) return "La ubicación es obligatoria."
  return null
}

export function validateIncidentDate(date: string): string | null {
  if (!date) return "La fecha del incidente es obligatoria."
  return null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "El correo es obligatorio."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Formato de correo inválido."
  if (email.length > MAX_EMAIL_LENGTH) return `El correo no puede superar los ${MAX_EMAIL_LENGTH} caracteres.`
  return null
}

export function validatePhone(phone?: string): string | null {
  if (!phone) return null
  if (phone.length > MAX_PHONE_LENGTH) return `El teléfono no puede superar los ${MAX_PHONE_LENGTH} caracteres.`
  return null
}

export function validateDetails(details?: string): string | null {
  if (!details) return null
  if (details.length > MAX_DETAILS_LENGTH) return `Las notas no pueden superar los ${MAX_DETAILS_LENGTH} caracteres.`
  return null
}
