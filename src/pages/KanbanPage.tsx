import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/kanban/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col h-screen overflow-hidden">
        {/* Encabezado del Kanban */}
        <header className="p-8 pb-0 pt-20 md:pt-8">
          <h2 className="text-3xl font-bold">Tablero Kanban - Mantenimiento</h2>
        </header>
        {/* El área del tablero se expande, el scroll es SOLO horizontal */}
        <section className="flex-1 overflow-x-auto overflow-y-hidden p-8 pt-4">
          <KanbanBoard />
        </section>
      </main>
    </div>
  );
}
