export default function Forbidden403() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-4xl font-bold mb-3">403 · Acceso denegado</h1>
      <p className="text-muted-foreground max-w-xl">
        No tienes permisos para ver este recurso. Pide a un administrador que te
        asigne el rol adecuado o verifique tus permisos.
      </p>
    </div>
  );
}
