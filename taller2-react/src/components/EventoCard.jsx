/* EventoCard — tarjeta de un evento, con el motivo visual de
   "talón de entrada". Recibe el evento y cuántas personas hay
   inscritas (dato derivado, calculado en App.jsx). */

import { formatearFecha } from "../utils/formato";

function EventoCard({ evento, inscritos, onInscribirse, onVerDetalle }) {
  const cuposRestantes = evento.aforoMax - inscritos;
  const agotado = cuposRestantes <= 0;

  return (
    <article className={"card-evento" + (agotado ? " agotado" : "")}>
      <div className="card-evento-info">
        <span className="badge-categoria">{evento.categoria}</span>

        <h3 className="h5 mt-2 mb-1 card-evento-nombre">{evento.nombre}</h3>
        <p className="text-muted small card-evento-desc">{evento.descripcion}</p>

        <ul className="card-evento-meta">
          <li>
            <i className="bi bi-calendar-event"></i>
            {formatearFecha(evento.fecha)}
          </li>
          <li>
            <i className="bi bi-geo-alt"></i>
            {evento.lugar}
          </li>
          <li>
            <i className="bi bi-person-badge"></i>
            {evento.organizador}
          </li>
        </ul>

        {/* Renderizado condicional: la marca sólo aparece si el
            evento es al aire libre. */}
        {evento.exterior && (
          <span className="badge text-bg-light border mt-2">
            <i className="bi bi-sun me-1"></i>
            Al aire libre
          </span>
        )}
      </div>

      <div className="card-evento-stub">
        <div>
          <strong className="stub-aforo-numero">
            {agotado ? 0 : cuposRestantes}
          </strong>
          <span className="stub-aforo-label">
            {agotado ? "agotado" : "cupos"}
          </span>
        </div>

        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onVerDetalle(evento.id)}>Ver detalle</button>
        <button
          type="button"
          className="btn btn-sm btn-inscribirse"
          disabled={agotado}
          onClick={() => onInscribirse(evento.id)}
        >
          {agotado ? "Agotado" : "Inscribirme"}
        </button>
      </div>
    </article>
  );
}

export default EventoCard;
