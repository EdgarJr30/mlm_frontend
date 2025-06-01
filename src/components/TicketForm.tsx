"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Checkbox } from "../components/ui/checkbox"
import { UserCircleIcon } from "@heroicons/react/24/solid"
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets"

interface TicketFormData {
  title: string
  description: string
  isUrgent: boolean
  requester: string
  incidentDate: string
  image: string // base64
  location: string
}

const initialForm: TicketFormData = {
  title: "",
  description: "",
  isUrgent: false,
  requester: "",
  incidentDate: "",
  image: "",
  location: "",
}

const locations = [
  "Operadora de Servicios Alimenticios",
  "Adrian Tropical 27",
  "Adrian Tropical Malecón",
  "Adrian Tropical Lincoln",
  "Adrian Tropical San Vicente",
  "Atracciones el Lago",
  "M7",
  "E. Arturo Trading",
  "Edificio Comunitario",
]

export default function TicketForm() {
  const [form, setForm] = useState(initialForm)
  const [imagePreview, setImagePreview] = useState("")
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (step === 1) {
      return !!form.title.trim() && !!form.description.trim()
    } else if (step === 2) {
      return !!form.requester.trim() && !!form.location
    } else if (step === 3) {
      return !!form.incidentDate
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep(step + 1)
    else alert("Completa los campos requeridos antes de continuar.")
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return alert("Completa los campos requeridos.")

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
    <form onSubmit={handleSubmit} className="min-h-screen">
      {/* HEADER CON PROGRESS COMPONENT */}
      <div className="w-full bg-white border-b border-gray-200 px-6 pt-4 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/kanban")}
              className="text-base font-medium text-black hover:underline flex items-center gap-2"
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
                <Label htmlFor="title">Título del Ticket <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="Ej. Aire acondicionado no enfría en oficina principal"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema con el mayor detalle posible. Incluye síntomas, cuándo comenzó el problema, y cualquier información relevante…"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Categoría <span className="text-red-500">*</span></Label>
                  <Select value={form.location} onValueChange={(value) => handleChange("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value="media" onValueChange={() => { }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">🟢 Baja</SelectItem>
                      <SelectItem value="media">🟡 Media</SelectItem>
                      <SelectItem value="alta">🟠 Alta</SelectItem>
                      <SelectItem value="urgente">🔴 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="isUrgent"
                  checked={form.isUrgent}
                  onCheckedChange={(value) => handleChange("isUrgent", value === true)}
                />
                <Label htmlFor="isUrgent" className="flex items-center gap-2 text-sm">
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
        <div className="space-y-4">
          <div>
            <Label htmlFor="requester">Solicitante *</Label>
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-6 w-6 text-gray-400" />
              <Input
                id="requester"
                value={form.requester}
                onChange={(e) => handleChange("requester", e.target.value)}
                placeholder="Nombre del solicitante"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Ubicación *</Label>
            <Select value={form.location} onValueChange={(value) => handleChange("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="incidentDate">Fecha del incidente *</Label>
            <Input
              id="incidentDate"
              type="date"
              value={form.incidentDate}
              onChange={(e) => handleChange("incidentDate", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="image">Imagen (opcional)</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 max-h-32 object-contain rounded border" />
            )}
          </div>
        </div>
      )}

      {/* Botones de navegación - siempre visibles */}
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

            {step < 4 ? (
              <Button type="button" className="px-6 py-2" onClick={handleNext}>
                Siguiente →
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Crear Ticket"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
