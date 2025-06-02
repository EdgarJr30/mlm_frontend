import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LOCATIONS } from "../components/constants/locations";
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Checkbox } from "../components/ui/checkbox"
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets"
import {
  validateTitle,
  validateDescription,
  validateRequester,
  validateLocation,
  validateIncidentDate,
  validateEmail
} from "../utils/validators"

interface TicketFormData {
  title: string
  description: string
  isUrgent?: boolean
  requester: string
  incidentDate: string
  deadlineDate?: string // ISO date string
  image?: string // base64
  location: string
  email: string
  phone?: string
  createdAt?: string // ISO date string
  details?: string // additional details
}

const initialForm: TicketFormData = {
  title: "",
  description: "",
  isUrgent: false,
  requester: "",
  incidentDate: "",
  deadlineDate: "", // Optional, can be set later
  image: "",
  location: "",
  email: "",
  phone: "",
  createdAt: new Date().toISOString(),
  // createdAt is set to the current date by default
  // but can be overridden if needed
  // when the ticket is created
  // in the handleSubmit function
  // this will be set to the current date
  // when the ticket is created
  // so it can be used to sort tickets by creation date
  // or for any other purpose
  details: "",
  // additional details can be added later
}

export default function TicketForm() {
  const [form, setForm] = useState(initialForm)
  const [imagePreview, setImagePreview] = useState("")
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormData, string>>>({})

  const navigate = useNavigate()

  const handleChange = (
    name: keyof TicketFormData,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return alert("El archivo supera los 10MB")

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setForm((prev) => ({ ...prev, image: base64 }))
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof TicketFormData, string>> = {}

    if (step === 1) {
      newErrors.title = validateTitle(form.title) ?? undefined
      newErrors.description = validateDescription(form.description) ?? undefined
    }

    if (step === 2) {
      newErrors.requester = validateRequester(form.requester) ?? undefined
      newErrors.email = validateEmail(form.email) ?? undefined
      newErrors.location = validateLocation(form.location) ?? undefined
    }

    if (step === 3) {
      newErrors.incidentDate = validateIncidentDate(form.incidentDate) ?? undefined
    }

    // Filtra nulls
    const filtered = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => v != null)
    ) as typeof newErrors

    setErrors(filtered)
    return Object.keys(filtered).length === 0
  }


  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }
  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step !== 4) return
    if (!validateStep()) return

    setIsSubmitting(true)
    const newTicket = {
      ...form,
      id: Date.now(),
      status: "Pendiente",
      responsible: "Sin asignar",
    }
    const tickets = [newTicket, ...getTicketsFromStorage()]
    saveTicketsToStorage(tickets)

    alert("Ticket creado exitosamente")
    setForm(initialForm)
    setImagePreview("")
    setStep(1)
    navigate("/kanban")
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen">
      {/* HEADER CON PROGRESS COMPONENT */}
      <div className="w-full bg-white border-b border-gray-200 px-6 pt-4 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/kanban")}
              className="text-base font-medium text-black hover:underline flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <span className="text-sm font-semibold text-black border border-gray-300 rounded-full px-4 py-1">
              Paso {step} de 4
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Crear Ticket de Mantenimiento</h1>
            <p className="text-base text-gray-500 mt-1">Completa la información para crear un nuevo ticket</p>
          </div>

          {/* Barra de progreso con estilo personalizado */}
          <div className="mt-6">
            <Progress value={progress} className="mt-2" />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span className={step === 1 ? "text-blue-600 font-medium" : ""}>Información Básica</span>
              <span className={step === 2 ? "text-blue-600 font-medium" : ""}>Solicitante y Ubicación</span>
              <span className={step === 3 ? "text-blue-600 font-medium" : ""}>Fechas y Asignación</span>
              <span className={step === 4 ? "text-blue-600 font-medium" : ""}>Revisión y Envío</span>
            </div>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="w-full flex justify-center mt-10">
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl px-8 py-8 space-y-8 shadow-sm">
            {/* Título del paso */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>

              <h2 className="text-lg font-semibold text-gray-900">Información Básica del Ticket</h2>
            </div>

            {/* Contenido del paso */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título del Ticket <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  maxLength={30}
                  placeholder="Ej. Aire acondicionado no enfría en oficina principal"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
                <div className="flex justify-between items-center">
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                  <p
                    className={`text-xs ml-auto ${form.title.length >= 15 ? "text-red-500" : "text-gray-400"
                      }`}
                  >
                    {form.title.length}/30 caracteres
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción Detallada <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  maxLength={60}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
                <div className="flex justify-between items-center">
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  <p
                    className={`text-xs ml-auto ${form.description.length >= 30 ? "text-red-500" : "text-gray-400"
                      }`}
                  >
                    {form.description.length}/60 caracteres
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="isUrgent"
                  checked={form.isUrgent}
                  onCheckedChange={(value) => handleChange("isUrgent", value === true)}
                />
                <Label htmlFor="isUrgent" className="flex items-center gap-2 text-sm cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  Marcar como urgente (requiere atención inmediata)
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="w-full flex justify-center mt-10">
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl px-8 py-8 space-y-8 shadow-sm">
            {/* Título del paso */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Información del Solicitante y Ubicación</h2>
            </div>

            {/* Contenido del paso */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="requester">Nombre del Solicitante <span className="text-red-500">*</span></Label>
                  <Input
                    id="requester"
                    placeholder="Ej. Tu nombre completo"
                    value={form.requester}
                    onChange={(e) => handleChange("requester", e.target.value)}
                    required
                  />
                  {errors.requester && <p className="text-sm text-red-500">{errors.requester}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de Contacto <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tuemail@cilm.do"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto  <span className="">(Opcional)</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    pattern="^\+?[0-9\s\-\(\)]+$"
                    title="Formato válido: +1 (809) 123-4567"
                    placeholder="Ej. +1 (809) 123-4567"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación <span className="text-red-500">*</span></Label>
                  <Select value={form.location} onValueChange={(value) => handleChange("location", value)}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Selecciona una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full flex justify-center mt-10">
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl px-8 py-8 space-y-8 shadow-sm">
            {/* Título del paso */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>

              <h2 className="text-lg font-semibold text-gray-900">Fechas y Asignación</h2>
            </div>
            {/* Contenido del paso */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Fecha del incidente <span className="text-red-500">*</span></Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    className="cursor-pointer"
                    value={form.incidentDate}
                    onChange={(e) => handleChange("incidentDate", e.target.value)}
                    required
                  />
                  {errors.incidentDate && <p className="text-sm text-red-500">{errors.incidentDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Fecha Límite Deseada <span className="">(Opcional)</span></Label>
                  <Input
                    id="deadlineDate"
                    type="date"
                    className="cursor-pointer"
                    value={form.deadlineDate}
                    onChange={(e) => handleChange("deadlineDate", e.target.value)}
                    required={false}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Archivos djuntos <span className="">(Opcional)</span></Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-32 object-contain rounded border" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Notas Adicionales <span className="">(Opcional)</span></Label>
                <Textarea
                  id="details"
                  placeholder="Cualquier informacion adicional que pueda ser util para resolver el problema…"
                  rows={4}
                  value={form.details}
                  onChange={(e) => handleChange("details", e.target.value)}
                  required={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <div className="w-full flex justify-center mt-10">
            <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl px-8 py-8 space-y-8 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Revisión y Envío</h2>
                <p className="text-sm text-gray-500 border border-yellow-200 bg-yellow-50 px-4 py-2 rounded">
                  Por favor revisa toda la información antes de enviar el ticket.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-1">📝 Información del Ticket</h3>
                  <p><strong>Título:</strong> {form.title}</p>
                  <p><strong>Descripción:</strong> {form.description}</p>
                  <p><strong>Urgente:</strong> {form.isUrgent ? "Sí 🚨" : "No"}</p>
                  <p><strong>Notas adicionales:</strong> {form.details || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-1">👤 Información del Solicitante</h3>
                  <p><strong>Nombre:</strong> {form.requester}</p>
                  <p><strong>Email:</strong> {form.email}</p>
                  <p><strong>Teléfono:</strong> {form.phone || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-1">📍 Ubicación</h3>
                  <p><strong>Ubicación:</strong> {form.location}</p>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-1">📆 Fechas</h3>
                  <p><strong>Fecha del incidente:</strong> {form.incidentDate}</p>
                  <p><strong>Fecha límite deseada:</strong> {form.deadlineDate || "N/A"}</p>
                </div>

                {imagePreview && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-1">📎 Imagen Adjunta</h3>
                    <img src={imagePreview} alt="Preview" className="mt-2 max-h-32 object-contain rounded border" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de navegación en el paso 4 */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-5xl px-18 pb-8">
              <div className="flex justify-between pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  type="button"
                  className="px-6 py-2 "
                  onClick={handlePrevious}
                >
                  ← Anterior
                </Button>
                <Button type="submit" className="px-6 py-2" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Crear Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Botones para pasos 1, 2 y 3 */}
      {step < 4 && (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-5xl px-18 pb-8">
            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                className="px-6 py-2"
                onClick={handlePrevious}
                disabled={step === 1}
              >
                ← Anterior
              </Button>
              <Button
                type="button"
                className="px-6 py-2"
                onClick={handleNext}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
