import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/kanban/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden w-full md:pl-[4rem]">
        {/* Encabezado del Kanban */}
        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-20 sm:pt-10 md:pt-8">
          <h2 className="text-3xl font-bold">Tablero</h2>
        </header>
        {/* El área del tablero se expande, el scroll es SOLO horizontal */}
        <section className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 pt-4 pb-8">
          <KanbanBoard />
        </section>
      </main>
    </div>
  );
}
