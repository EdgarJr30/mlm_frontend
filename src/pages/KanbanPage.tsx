import { useState } from "react";
import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/kanban/KanbanBoard";
import Navbar from "../components/navigation/Navbar";
import SearchTickets from "../components/SearchTickets";

export default function KanbanPage() {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
        <div className="w-full px-4 md:px-6 lg:px-8 pt-4">
          {/* Navbar y búsqueda */}
          <div className="flex justify-between items-center">
            <Navbar />
            <SearchTickets onSearch={setSearchTerm} />
          </div>
        </div>

        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
          <h2 className="text-3xl font-bold">Tablero</h2>
        </header>

        <section className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 pt-4 pb-8">
          <KanbanBoard searchTerm={searchTerm} />
        </section>
      </main>
    </div>
  );
}
