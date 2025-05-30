import React, { useState } from "react";
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets";
import { useNavigate } from "react-router-dom";
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';

export default function TicketForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "media",
    requester: "",
    image: "", // base64
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const navigate = useNavigate();

  // Manejar cambios de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar carga de imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo supera el tamaño máximo de 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, image: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Guardar el ticket
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prevTickets = getTicketsFromStorage();
    const newTicket = {
      ...form,
      id: Date.now(),
      status: "Pendiente",
      responsible: "Sin asignar",
    };
    const updatedTickets = [newTicket, ...prevTickets];
    saveTicketsToStorage(updatedTickets);
    navigate("/kanban", { replace: true });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12">
        {/* ...otros campos... */}
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Crear Ticket de Mantenimiento</h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            Ingresa la información para crear un nuevo ticket al equipo de mantenimiento.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            {/* Título */}
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm/6 font-medium text-gray-900">
                Título del ticket
              </label>
              <div className="mt-2">
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Ej: Aire acondicionado no enfría"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                />
              </div>
            </div>
            {/* Descripción */}
            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm/6 font-medium text-gray-900">
                Descripción
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                  placeholder="Describe el problema con detalle"
                />
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">Agrega detalles que ayuden a resolver el ticket.</p>
            </div>
            {/* Prioridad */}
            <div className="sm:col-span-2">
              <label htmlFor="priority" className="block text-sm/6 font-medium text-gray-900">
                Prioridad
              </label>
              <div className="mt-2">
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            {/* Solicitante */}
            <div className="sm:col-span-4">
              <label htmlFor="requester" className="block text-sm/6 font-medium text-gray-900">
                Solicitante
              </label>
              <div className="mt-2 flex items-center gap-x-2">
                <UserCircleIcon className="size-8 text-gray-300" />
                <input
                  id="requester"
                  name="requester"
                  type="text"
                  placeholder="Nombre del solicitante"
                  value={form.requester}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                />
              </div>
            </div>
            {/* Foto o archivo adjunto */}
            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm/6 font-medium text-gray-900">
                Foto (opcional)
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-6">
                <div className="text-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto mb-2 h-24 w-auto object-contain rounded" />
                  ) : (
                    <PhotoIcon className="mx-auto size-12 text-gray-300" aria-hidden="true" />
                  )}
                  <div className="mt-4 flex text-sm/6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 hover:text-blue-500"
                    >
                      <span>Subir archivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs/5 text-gray-600">PNG, JPG, GIF hasta 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Botones */}
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button type="button" onClick={() => navigate("/kanban")} className="text-sm/6 font-semibold text-gray-900">
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-blue-600"
          >
            Crear Ticket
          </button>
        </div>
      </div>
    </form>
  );
}
