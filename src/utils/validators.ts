
export const MAX_TITLE_LENGTH = 30
export const MAX_DESCRIPTION_LENGTH = 60

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
  return null
}