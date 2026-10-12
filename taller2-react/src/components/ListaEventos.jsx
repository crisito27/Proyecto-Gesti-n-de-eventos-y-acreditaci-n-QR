/* ListaEventos — recorre la colección y pinta una EventoCard por
   cada elemento. La "key" es el id del evento: React la usa para
   saber qué elemento cambió sin volver a crear toda la lista. */

import EventoCard from "./EventoCard";

function ListaEventos({ eventos, contarInscritos, onInscribirse, onVerDetalle }) {
  if (eventos.length === 0) {
    return (
      <div className="empty-state text-center py-5">
        <i className="bi bi-search display-4"></i>
        <p className="mt-3 text-muted">
          No se encontraron eventos con esos filtros.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted small mb-3">
        {eventos.length} evento(s) encontrado(s).
      </p>

      <div className="row g-3">
        {eventos.map((evento) => (
          <div className="col-12 col-lg-6" key={evento.id}>
            <EventoCard
              evento={evento}
              inscritos={contarInscritos(evento.id)}
              onInscribirse={onInscribirse}
        onVerDetalle={onVerDetalle}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default ListaEventos;
