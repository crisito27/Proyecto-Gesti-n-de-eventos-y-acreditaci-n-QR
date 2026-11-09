/* ListaEventos — recorre la colección y pinta una tarjeta por evento.
   La `key` es el id que asigna PostgreSQL. */

import EventoCard from "./EventoCard";
import { Vacio } from "./EstadoRecurso";

function ListaEventos({ eventos, onInscribirse, onVerDetalle }) {
  if (eventos.length === 0) {
    return (
      <Vacio icono="search" mensaje="No se encontraron eventos con esos filtros." />
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
