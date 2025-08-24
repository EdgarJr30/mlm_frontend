import type { FilterSchema } from '../../types/filters';

export type InboxFilterKey =
  | 'q'
  | 'location'
  | 'priority'
  | 'status'
  | 'has_image'
  | 'accepted'
  | 'created_at';

export const inboxFilters: FilterSchema<InboxFilterKey> = {
  id: 'inbox',
  columnMap: {
      q: 'title',
      location: '',
      priority: 'priority',
      status: '',
      has_image: '',
      accepted: '',
      created_at: ''
  },
  fields: [
    // Titulo o solicitante
    {
      key: 'q',
      type: 'text',
      label: 'Buscar',
      placeholder: 'ID, título o solicitante',
      minChars: 2,
      responsive: 'both',
    },
    // Ubicación
    {
      key: 'location',
      type: 'select',
      label: 'Ubicación',
      options: [
        { label: 'Todas', value: '' },
        { label: 'Operadora de Servicios Alimenticios', value: 'Operadora de Servicios Alimenticios' },
        { label: 'Adrian Tropical 27', value: 'Adrian Tropical 27' },
        { label: 'Adrian Tropical Malecón', value: 'Adrian Tropical Malecón' },
        { label: 'Adrian Tropical Lincoln', value: 'Adrian Tropical Lincoln' },
        { label: 'Adrian Tropical San Vicente', value: 'Adrian Tropical San Vicente' },
        { label: 'Atracciones el Lago', value: 'Atracciones el Lago' },
        { label: 'M7', value: 'M7' },
        { label: 'E. Arturo Trading', value: 'E. Arturo Trading' },
        { label: 'Edificio Comunitario', value: 'Edificio Comunitario' },
      ],
      responsive: 'both',
    },
    // Prioridad
    {
      key: 'priority',
      type: 'multiselect',
      label: 'Prioridad',
      options: [
        { label: 'Baja', value: 'baja' },
        { label: 'Media', value: 'media' },
        { label: 'Alta', value: 'alta' },
      ],
      responsive: 'both',
    },
    // Estado
    {
      key: 'status',
      type: 'multiselect',
      label: 'Estado',
      options: [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Ejecución', value: 'En Ejecución' },
        { label: 'Finalizadas', value: 'Finalizadas' },
      ],
      responsive: 'drawer',
    },
    // Con imagenes
    { key: 'has_image', type: 'boolean', label: 'Con adjuntos', responsive: 'drawer' },
    // Aceptados
    // Filtro técnico, oculto, siempre false
    { key: 'accepted', type: 'boolean', label: 'Aceptados', defaultValue: false, hidden: true },

    // Fecha de creación
    { key: 'created_at', type: 'daterange', label: 'Fecha de creación', responsive: 'drawer' },
  ],
};
