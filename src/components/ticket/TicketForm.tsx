import { useState } from "react"
import { Locations } from "../../types/Ticket";
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Checkbox } from "../ui/checkbox"
import { createTicket } from "../../services/ticketService";
import {
  validateTitle,
  validateDescription,
  validateRequester,
  validateLocation,
  validateIncidentDate,
  validateEmail,
  validatePhone,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_REQUESTER_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PHONE_LENGTH
} from "../../utils/validators"
import { showSuccessAlert } from "../../utils/showAlert"
import { getNowInTimezoneForStorage, getTodayISODate } from "../../utils/formatDate";
import AppVersion from "../AppVersion";
// import { sendTicketEmail } from "../../services/emailService";
// import type { TicketEmailData } from "../../services/emailService";

interface TicketFormData {
  title: string
  description: string
  is_urgent: boolean
  requester: string
  priority: "baja" | "media" | "alta"
  incident_date: string
  deadline_date?: string // ISO date string
  image: string // base64
  location: string
  email?: string
  phone?: string
  created_at: string // ISO date string
}

const initialForm: TicketFormData = {
  title: "",
  description: "",
  is_urgent: false,
  requester: "",
  priority: "baja", // Default priority
  incident_date: "",
  deadline_date: undefined, // Optional, can be set later
  image: "",
  location: "",
  email: "",
  phone: "",
  created_at: getNowInTimezoneForStorage("America/Santo_Domingo"),
  // createdAt is set to the current date by default
}

export default function TicketForm() {
  const [form, setForm] = useState(initialForm)
  const [imagePreview, setImagePreview] = useState("")
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormData | "image", string>>>({})

  const handleChange = (
    name: keyof TicketFormData,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validación de tamaño
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "La imagen no puede superar los 10MB." }))
      setForm((prev) => ({ ...prev, image: "" }))
      setImagePreview("")
      return
    }

    // Si todo está bien, limpia errores y carga imagen
    setErrors((prev) => ({ ...prev, image: undefined }))
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
      newErrors.email = validateEmail(form.email ?? "") ?? undefined
      newErrors.location = validateLocation(form.location) ?? undefined
      newErrors.phone = validatePhone(form.phone) ?? undefined
    }

    if (step === 3) {
      newErrors.incident_date = validateIncidentDate(form.incident_date) ?? undefined
      if (!form.image) {
        newErrors.image = "La imagen es obligatoria."
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) return;
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const ticketToSave = {
        ...form,
        priority: form.priority ?? "baja",
        status: "Pendiente",
        assignee: "Sin asignar",
      };

      const created = await createTicket(ticketToSave);
      const ticketId = created.id;
      const ticketTitle = created.title;

      // TODO: Manejar el envio de creación de ticket cuando termine el backend
      // try {
      //   const emailData: TicketEmailData = {
      //     title: form.title,
      //     description: form.description,
      //     requester: form.requester,
      //     email: form.email ?? "",
      //     location: form.location,
      //     incident_date: form.incident_date,
      //   };
      //   await sendTicketEmail(emailData);
      // } catch (emailError) {
      //   console.error("Error enviando correo:", emailError);
      // }

      await showSuccessAlert(
        `Ticket [##${ticketId}##] creado.`,
        `Tu ticket "${ticketTitle}" ha sido registrado con éxito.`
      );

      window.location.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error al crear el ticket:", error.message);
      } else {
        console.error("Error al crear el ticket:", error);
      }
      alert("Hubo un error al crear el ticket. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / 4) * 100

  return (
    <div className="h-[100dvh]">
      {/* HEADER CON PROGRESS COMPONENT */}
      <div className="w-full bg-white border-b border-gray-200 px-6 pt-4 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="mt-4">
              <h1 className="text-2xl font-extrabold text-gray-900">Crear Ticket de Mantenimiento</h1>
              {/* <p className="text-base text-gray-500 mt-1">Completa la información para crear un nuevo ticket</p> */}
            </div>
            <AppVersion className="text-center mt-auto" />
            <span className="w-[100px] min-w-[100px] max-w-[100px] text-center py-1 px-2 rounded-full border text-sm font-medium bg-white shadow whitespace-nowrap">
              Paso {step} de 4
            </span>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
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
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder="Ej. Aire acondicionado no enfría en oficina principal"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
                <div className="flex justify-between items-center">
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                  <p
                    className={`text-xs ml-auto ${form.title.length >= Math.floor(MAX_TITLE_LENGTH * 0.85) ? "text-red-500" : "text-gray-400"
                      }`}
                  >
                    {form.title.length}/{MAX_TITLE_LENGTH} caracteres
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción Detallada <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-[100px] max-h-[150px] resize-y"
                />
                <div className="flex justify-between items-center">
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  <p
                    className={`text-xs ml-auto ${form.description.length >= Math.floor(MAX_DESCRIPTION_LENGTH * 0.85) ? "text-red-500" : "text-gray-400"
                      }`}
                  >
                    {form.description.length}/{MAX_DESCRIPTION_LENGTH} caracteres
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="is_urgent"
                  checked={form.is_urgent}
                  onCheckedChange={(value) => handleChange("is_urgent", value === true)}
                />
                <Label htmlFor="is_urgent" className="flex items-center gap-2 text-sm cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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
                    maxLength={MAX_REQUESTER_LENGTH}
                    placeholder="Ej. Tu nombre completo"
                    value={form.requester}
                    onChange={(e) => handleChange("requester", e.target.value)}
                    required
                  />
                  {errors.requester && <p className="text-sm text-red-500">{errors.requester}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de Contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    maxLength={MAX_EMAIL_LENGTH}
                    placeholder="tuemail@cilm.do"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
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
                    maxLength={MAX_PHONE_LENGTH}
                    pattern="^\+?[0-9\s\-\(\)]+$"
                    title="Formato válido: +1 (809) 123-4567"
                    placeholder="Ej. +1 (809) 123-4567"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required={false}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación <span className="text-red-500">*</span></Label>
                  <Select value={form.location} onValueChange={(value) => handleChange("location", value)}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Selecciona una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {Locations.map((loc) => (
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
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
                    value={form.incident_date}
                    onChange={(e) => handleChange("incident_date", e.target.value)}
                    max={getTodayISODate()}
                    onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                    required
                  />
                  {errors.incident_date && <p className="text-sm text-red-500">{errors.incident_date}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Imagen del incidente <span className="text-red-500">*</span></Label>
                <Input type="file" accept="image/*" multiple={false} onChange={handleFileChange} className="cursor-pointer" />
                {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-32 object-contain rounded border" />
                )}
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
                  <p><strong>Urgente:</strong> {form.is_urgent ? "Sí 🚨" : "No"}</p>
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
                  <p><strong>Fecha del incidente:</strong> {form.incident_date}</p>
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
                {step > 1 && (
                  <Button
                    variant="outline"
                    type="button"
                    className="px-6 py-2"
                    onClick={handlePrevious}
                  >
                    ← Anterior
                  </Button>
                )}<div className="px-6 py-2" />
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
              {step > 1 && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6 py-2"
                  onClick={handlePrevious}
                  disabled={step === 1}
                >
                  ← Anterior
                </Button>
              )}<div className="px-6 py-2" />
              {/* Solo muestra el botón "Anterior" si no es el primer paso */}
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
