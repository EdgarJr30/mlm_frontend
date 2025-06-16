import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 flex gap-4 text-white">
      <Link to="/crear-ticket" className="hover:underline">Crear Ticket</Link>
      <Link to="/kanban" className="hover:underline">Tablero Kanban</Link>
    </nav>
  );
}
