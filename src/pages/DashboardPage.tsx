// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/navigation/Navbar';
import KpiCard from '../components/layout/KpiCard';
import MttrTrendBar from '../components/dashboard/charts/MttrTrendBar';
import PreventiveVsCorrective from '../components/dashboard/charts/PreventiveVsCorrective';
import AgeDistribution from '../components/dashboard/charts/AgeDistribution';
import ComplianceByLocation from '../components/dashboard/charts/ComplianceByLocation';
import TechnicianLoadBar from '../components/dashboard/charts/TechnicianLoadBar';

import { getDashboardKpis } from '../services/reportService';
import type { ReportFilters } from '../types/Report';

export default function DashboardPage() {
  const [, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [kpis, setKpis] = useState<{
    openCount: number;
    overdueCount: number;
    mttrHours: number;
    preventiveCompliance: number;
    criticalBacklog: number;
  } | null>(null);

  const filters = useMemo<ReportFilters>(
    () => ({
      location: selectedLocation || undefined,
    }),
    [selectedLocation]
  );

  useEffect(() => {
    (async () => setKpis(await getDashboardKpis(filters)))();
  }, [JSON.stringify(filters)]);

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

        <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
          <h2 className="text-3xl font-bold">Panel de Mantenimiento</h2>
          <p className="text-sm text-gray-500 mt-1">
            Vista general — sólo tickets aceptados
          </p>
        </header>

        {/* KPIs */}
        <section className="px-4 md:px-6 lg:px-8 pt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            title="OTs Abiertas"
            value={kpis?.openCount ?? '—'}
            subtitle="Actualmente abiertas"
          />
          <KpiCard
            title="OTs Vencidas"
            value={kpis?.overdueCount ?? '—'}
            subtitle="No cerradas a tiempo"
          />
          <KpiCard
            title="MTTR (h)"
            value={kpis?.mttrHours ?? '—'}
            subtitle="Tiempo medio de reparación"
          />
          <KpiCard
            title="Cumplimiento Preventivo"
            value={`${kpis?.preventiveCompliance ?? 0}%`}
            subtitle="OTs preventivas completadas"
          />
          <KpiCard
            title="Backlog Crítico"
            value={kpis?.criticalBacklog ?? '—'}
            subtitle="Prioridad Crítica abiertas"
          />
        </section>

        {/* Gráficos */}
        <section className="px-4 md:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
          <MttrTrendBar filters={filters} />
          <PreventiveVsCorrective filters={filters} />
          <AgeDistribution filters={filters} />
          <ComplianceByLocation filters={filters} />
          <TechnicianLoadBar filters={filters} />
        </section>
      </main>
    </div>
  );
}
