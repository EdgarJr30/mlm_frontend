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

  const progress = (step / 3) * 100

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Crear Ticket de Mantenimiento</h1>
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground mt-1">Paso {step} de 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título del ticket *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ej: Aire acondicionado no enfría"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe el problema con detalle"
              rows={4}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={form.isUrgent}
              onCheckedChange={(value) => handleChange("isUrgent", value === true)}
              id="urgent"
            />
            <Label htmlFor="urgent">Marcar como urgente</Label>
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

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={step === 1}>
          Anterior
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Crear Ticket"}
          </Button>
        )}
      </div>
    </form>
  )
}
