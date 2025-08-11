import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from '../../assets/logo_horizontal_blanc.svg';
import { signOut } from "../../utils/auth";
import AppVersion from "./AppVersion";

const menu = [
  {
    name: "Dashboard",
    path: "/kanban",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>

    ),
  },
  {
    name: "Bandeja de Entrada",
    path: "/inbox",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
      </svg>
    ),
  },
  {
    name: "Usuarios",
    path: "/admin_usuarios",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    name: "Crear Ticket",
    path: "/crear-ticket",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
        className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  // { name: "Reportes", path: "#" },
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Handler para el logout
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error.message);
        return;
      }
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      console.error(
        err instanceof Error ? err.message : "Error inesperado al cerrar sesión"
      );
    }
  };
  return (
    <>
      {/* Botón hamburguesa solo en móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white text-gray-800 p-2 rounded-md shadow"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay oscuro cuando el sidebar está abierto */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          } md:hidden`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar móvil (drawer) y escritorio (estático) */}
      <aside
        className={`
    fixed top-0 left-0 w-60 bg-gray-900 text-gray-200 shadow-xl flex flex-col z-50 
    transform transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:static md:flex h-[100dvh] overflow-y-auto
  `}
      >
        <div className="p-6 text-2xl font-bold tracking-wide text-blue-400 border-b border-gray-700 mb-4">
          <img src={Logo} alt="MLM Logo" className="h-8 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 flex-1 px-2">
          {menu.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
      px-4 py-3 rounded transition font-medium flex items-center
      ${location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800"}
    `}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* BOTÓN DE LOGOUT */}
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-2 px-4 py-3 mb-2 rounded
            text-red-500 hover:bg-gray-800 transition font-medium
            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer
            focus-visible:ring-offset-2
            focus-visible:ring-offset-gray-900
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
            className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3-3h8.25m0 0-3-3m3 3-3 3" />
          </svg>
          Cerrar sesión
        </button>

        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-800">
          © 2025 CILM
        </div>
        <AppVersion className="text-center mt-auto" />

      </aside>
    </>
  );
}
