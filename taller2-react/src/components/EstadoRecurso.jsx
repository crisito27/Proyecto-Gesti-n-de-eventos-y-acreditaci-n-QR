/* =========================================================
   Componentes de estado: carga, error y vacío.

   La rúbrica pide que la interfaz comunique qué está pasando en
   cada momento. Tenerlos como componentes reutilizables mantiene
   el mismo lenguaje visual en todas las pantallas.
   ========================================================= */

export function Cargando({ mensaje = "Cargando..." }) {
  return (
    <div className="text-center text-muted py-5" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm me-2"></span>
      {mensaje}
    </div>
  );
}

export function ErrorCarga({ error, onReintentar }) {
  const sinConexion = error?.codigo === "sin_conexion";

  return (
    <div className="alert alert-danger" role="alert">
      <p className="mb-1">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <strong>No se pudieron cargar los datos.</strong>
      </p>
      <p className="mb-2 small">{error?.message ?? "Error desconocido."}</p>

      {sinConexion && (
        <p className="mb-2 small text-muted">
          Comprueba que el backend esté levantado con{" "}
          <code>docker compose up</code>.
        </p>
      )}

      {onReintentar && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Vacio({ icono = "inbox", mensaje, children }) {
  return (
    <div className="empty-state text-center py-5">
      <i className={`bi bi-${icono} display-4`}></i>
      <p className="mt-3 text-muted">{mensaje}</p>
      {children}
    </div>
  );
}

/** Envuelve una sección: decide qué mostrar según el estado de la consulta. */
export function Recurso({ cargando, error, vacio, onReintentar, mensajeVacio, children }) {
  if (cargando) return <Cargando />;
  if (error) return <ErrorCarga error={error} onReintentar={onReintentar} />;
  if (vacio) return <Vacio mensaje={mensajeVacio ?? "No hay nada que mostrar."} />;
  return children;
}
