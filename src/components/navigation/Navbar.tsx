import { useState, useEffect } from "react";
import { Disclosure } from '@headlessui/react'
// import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
// import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
// import { useTicketNotification } from "../../context/TicketNotificationContext";
// import { useTicketNotificationPolling } from "../../hooks/useTicketNotificationPolling";
// import { getTotalTicketsCount } from "../../services/ticketService";
import { LOCATIONS } from "../constants/locations";

interface NavbarProps {
  onSearch: (term: string) => void;
  onFilterLocation: (location: string) => void;
  selectedLocation: string;
}

export default function Navbar({ onSearch, selectedLocation, onFilterLocation }: NavbarProps) {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  // const {
  //   newTicketsCount,
  //   setTotalTicketsWhenOpened,
  //   setNewTicketsCount,
  // } = useTicketNotification();

  // useTicketNotificationPolling();

  // Lógica al refrescar tickets (puedes ajustar según tu flujo)
  // const handleRefreshTickets = async () => {
  //   if (typeof onSearch === "function") onSearch(""); // o la función que refresca tu tabla
  //   const total = await getTotalTicketsCount();
  //   setTotalTicketsWhenOpened(total);
  //   setNewTicketsCount(0);
  // };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedInput(input);
    }, 500);

    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    if (debouncedInput.length >= 2 || debouncedInput.length === 0) {
      console.log("🔍 Buscando con:", debouncedInput);
      onSearch(debouncedInput);
    }
  }, [debouncedInput, onSearch]);

  return (
    <Disclosure as="nav" className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Filtros (solo desktop) */}
          <div className="mr-3 w-[180px]">
            <select
              value={selectedLocation}
              onChange={e => onFilterLocation(e.target.value)}
              className="block w-full rounded-md bg-white border border-gray-300 py-1.5 pl-2 pr-8 text-base text-gray-900 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
            >
              <option value="">Todas las ubicaciones</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          {/* <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
            <a
              href="#"
              className="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
            >
              Filtros
            </a>
          </div> */}

          {/* Buscador responsive */}
          <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="grid w-[120px] xs:w-[160px] sm:w-[200px] md:w-full max-w-xs grid-cols-1 pl-0">
              <input
                name="search"
                type="search"
                placeholder="Buscar por título o solicitante"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
              />
            </div>
          </div>

          {/* Campanita en móvil */}
          {/* <div className="flex items-center lg:hidden mr-2">
            <button
              type="button"
              className="relative shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
              onClick={handleRefreshTickets}
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">Ver notificaciones</span>
              <BellIcon aria-hidden="true" className="size-6" />
              {newTicketsCount > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center animate-bounce shadow">{newTicketsCount}</span>
              )}
            </button>
          </div> */}

          {/* Menú hamburguesa en móvil */}
          {/* <div className="flex items-center lg:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div> */}

          {/* Campanita solo en desktop */}
          {/* <div className="hidden lg:ml-4 lg:flex lg:items-center">
            <button
              type="button"
              className="relative shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
              onClick={handleRefreshTickets}
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
              {newTicketsCount > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center animate-bounce shadow">{newTicketsCount}</span>
              )}
            </button>
          </div> */}
        </div>
      </div>

      {/* <DisclosurePanel className="lg:hidden">
        <div className="space-y-1 pt-2 pb-3">
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pr-4 pl-3 text-base font-medium text-indigo-700"
          >
            Filtros
          </DisclosureButton>
        </div>
      </DisclosurePanel> */}
    </Disclosure>
  )
}
