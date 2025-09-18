import { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/navigation/Navbar';
import RoleList from '../../components/dashboard/roles/RoleList';
import PermissionsTable from '../../components/dashboard/permissions/PermissionsTable';

export default function RoleManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(''); // reservado por consistencia con Navbar
  const [tab, setTab] = useState<'roles' | 'permissions'>('roles');

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
        <div className="w-full">
          <Navbar
            onSearch={setSearchTerm}
            onFilterLocation={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
        </div>

        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Roles & Permisos</h2>
            <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
              <button
                onClick={() => setTab('roles')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                  tab === 'roles'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                Roles
              </button>
              <button
                onClick={() => setTab('permissions')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                  tab === 'permissions'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                Permisos
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
          {tab === 'roles' ? (
            <RoleList searchTerm={searchTerm} />
          ) : (
            <PermissionsTable searchTerm={searchTerm} />
          )}
        </section>
      </main>
    </div>
  );
}
