import React, { useState } from "react";
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets";
import { useNavigate } from "react-router-dom";

export default function TicketForm() {
   const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "media",
    requester: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prevTickets = getTicketsFromStorage();
    const newTicket = {
      ...form,
      id: Date.now(), // único por tiempo
      status: "Pendiente",
      responsible: "Sin asignar"
    };
    const updatedTickets = [newTicket, ...prevTickets];
    saveTicketsToStorage(updatedTickets);
    // Redirige al Kanban para que se refresque la vista
    navigate("/kanban", { replace: true });
  };

  return (
    <form
      className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold mb-6">Crear Ticket de Mantenimiento</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium">Título</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="mt-1 p-2 w-full border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          className="mt-1 p-2 w-full border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Prioridad</label>
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium">Solicitante</label>
        <input
          type="text"
          name="requester"
          value={form.requester}
          onChange={handleChange}
          required
          className="mt-1 p-2 w-full border rounded"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Crear Ticket
      </button>
    </form>
  );
}
