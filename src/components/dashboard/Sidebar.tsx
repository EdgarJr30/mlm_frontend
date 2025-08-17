import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo_horizontal_blanc.svg';
import { signOut } from '../../utils/auth';
import AppVersion from '../ui/AppVersion';
import { useAuth } from '../../context/AuthContext';
import { APP_ROUTES } from '../Routes/appRoutes';

export default function Sidebar() {
  const { role, loading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // 1) Mientras carga auth/rol, NO mostramos items (evita el flash)
  if (loading) {
    return (
      <>
        {/* botón y skeleton mínimos */}
        <aside className="fixed top-0 left-0 w-60 bg-gray-900 text-gray-200 flex flex-col h-[100dvh]">
          <div className="p-6 border-b border-gray-700">
            <img src={Logo} alt="MLM Logo" className="h-8 w-auto" />
          </div>
          <div className="p-4 space-y-2">
            <div className="h-9 rounded bg-gray-800 animate-pulse" />
            <div className="h-9 rounded bg-gray-800 animate-pulse" />
            <div className="h-9 rounded bg-gray-800 animate-pulse" />
          </div>
          <AppVersion className="text-center mt-auto" />
        </aside>
      </>
    );
  }

  const visibleMenu = APP_ROUTES.filter(
    (r) => r.showInSidebar && role != null && r.allow.includes(role)
  );

  // Handler para el logout
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
        return;
      }
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      console.error(
        err instanceof Error ? err.message : 'Error inesperado al cerrar sesión'
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
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay oscuro cuando el sidebar está abierto */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } md:hidden`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar móvil (drawer) y escritorio (estático) */}
      <aside
        className={`
    fixed top-0 left-0 w-60 bg-gray-900 text-gray-200 shadow-xl flex flex-col z-50 
    transform transition-transform duration-300
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:flex h-[100dvh] overflow-y-auto
  `}
      >
        <div className="p-6 text-2xl font-bold tracking-wide text-blue-400 border-b border-gray-700 mb-4">
          <img src={Logo} alt="MLM Logo" className="h-8 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 flex-1 px-2">
          {visibleMenu.map(
            (
              item // 👈 usamos visibleMenu
            ) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded transition font-medium flex items-center
              ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800'
              }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          )}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3-3h8.25m0 0-3-3m3 3-3 3"
            />
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
