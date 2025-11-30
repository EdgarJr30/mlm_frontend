// src/pages/inventory/warehouses/InventoryWarehousePage.tsx

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';

type WarehouseProduct = {
  id: string;
  name: string;
  code: string;
  uom: string;
  quantity: number;
};

type WarehouseDetail = {
  id: string;
  name: string;
  products: WarehouseProduct[];
};

// Mock de almacenes → en tu app lo reemplazas por fetch/API.
const MOCK_WAREHOUSES: WarehouseDetail[] = [
  {
    id: 'oc-quimicos',
    name: 'OC - Químicos',
    products: [
      {
        id: '1',
        name: 'Aceite Vegetal',
        code: 'A000068',
        uom: 'LIBRAS',
        quantity: 150,
      },
      {
        id: '2',
        name: 'Sal Industrial',
        code: 'A000102',
        uom: 'KG',
        quantity: 200,
      },
      {
        id: '3',
        name: 'Cloro Concentrado',
        code: 'A000045',
        uom: 'LITROS',
        quantity: 75,
      },
    ],
  },
  // agrega más almacenes aquí si quieres...
];

export default function InventoryWarehousePage() {
  const navigate = useNavigate();
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [search, setSearch] = useState('');

  const warehouse = useMemo(
    () =>
      MOCK_WAREHOUSES.find((w) => w.id === warehouseId) ?? MOCK_WAREHOUSES[0],
    [warehouseId]
  );

  const filteredProducts = useMemo(
    () =>
      warehouse.products.filter((p) => {
        const term = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term)
        );
      }),
    [warehouse.products, search]
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar general de la app */}
      <Sidebar />

      <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
        {/* HEADER AZUL */}
        <header className="bg-blue-600 text-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="Volver"
            >
              <span className="text-2xl leading-none">‹</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {warehouse.name}
              </h1>
              <p className="text-sm sm:text-base mt-1 opacity-90">
                {warehouse.products.length} productos
              </p>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="bg-blue-600 pb-4 px-4 sm:px-6 lg:px-10">
            <div className="bg-white rounded-2xl shadow-sm flex items-center px-4 py-3 text-gray-500">
              <span className="mr-3 text-xl">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto o código..."
                className="w-full bg-transparent outline-none text-sm sm:text-base placeholder:text-gray-400"
              />
            </div>
          </div>
        </header>

        {/* LISTA DE PRODUCTOS */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-5xl">
            <div className="flex flex-col gap-3 sm:gap-4 pb-20">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  No se encontraron productos para “{search}”.
                </p>
              )}
            </div>
          </div>

          {/* FAB (+) */}
          <div className="pointer-events-none relative">
            <button
              className="pointer-events-auto fixed md:absolute bottom-6 right-6 md:right-10 h-16 w-16 rounded-full bg-blue-600 shadow-xl flex items-center justify-center text-4xl text-white"
              aria-label="Agregar producto"
              onClick={() =>
                navigate(`/osalm/conteos_inventario/${warehouse.id}/audits/new`)
              }
            >
              +
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: WarehouseProduct }) {
  return (
    <article className="bg-white rounded-2xl shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
      {/* IZQUIERDA: nombre, código, uom */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {product.name}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 tracking-wide">
          <span className="font-medium">{product.code}</span>
          <span className="mx-2">•</span>
          <span className="uppercase">{product.uom}</span>
        </p>
      </div>

      {/* DERECHA: cantidad + unidad */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">
            {product.quantity}
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400 uppercase">
            {product.uom}
          </span>
        </div>
        <button
          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-lg"
          aria-label="Ver detalle del producto"
        >
          ›
        </button>
      </div>
    </article>
  );
}
