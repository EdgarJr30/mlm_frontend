export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-2">403 — Acceso denegado</h1>
        <p className="text-gray-600">No tienes permisos para ver este contenido.</p>
      </div>
    </div>
  );
}
