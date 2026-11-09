/* EventoCard — tarjeta de un evento.

   Los cupos ya no se calculan en el navegador: vienen calculados
   por el backend en `cupos_disponibles` y `agotado`. El frontend
   sólo los muestra. */

import { formatearFecha, formatearPrecio } from "../utils/formato";

function EventoCard({ evento, onInscribirse, onVerDetalle }) {
  const agotado = evento.agotado;

  return (
    <article className={"card-evento" + (agotado ? " agotado" : "")}>
      <div className="card-evento-info">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="badge-categoria">{evento.categoria}</span>
          {evento.precio > 0 && (
            <span className="badge text-bg-light border">
              {formatearPrecio(evento.precio)}
            </span>
          )}
        </div>

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

        <div className="d-flex flex-wrap gap-2 mt-2">
          {evento.exterior && (
            <span className="badge text-bg-light border">
              <i className="bi bi-sun me-1"></i>
              Al aire libre
            </span>
          )}
          <button
            type="button"
            className="btn btn-sm btn-link p-0"
            onClick={() => onVerDetalle(evento.id)}
          >
            Ver detalle
          </button>
        </div>
      </div>

      <div className="card-evento-stub">
        <div>
          <strong className="stub-aforo-numero">{evento.cupos_disponibles}</strong>
          <span className="stub-aforo-label">{agotado ? "agotado" : "cupos"}</span>
        </div>

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
