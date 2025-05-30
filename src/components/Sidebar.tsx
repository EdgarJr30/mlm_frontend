import { Link, useLocation } from "react-router-dom";

const menu = [
  { name: "Crear Ticket", path: "/create-ticket" },
  { name: "Dashboard", path: "#" },
  { name: "Reportes", path: "#" }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="h-screen w-60 bg-gray-900 text-gray-200 shadow-xl flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 text-2xl font-bold tracking-wide text-blue-400 border-b border-gray-700 mb-4">
        Easy Maint
      </div>
      <nav className="flex flex-col gap-1 flex-1 px-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`
              px-4 py-3 rounded transition font-medium
              ${location.pathname === item.path
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800"}
            `}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-800">
        © 2025 CILM
      </div>
    </aside>
  );
}
