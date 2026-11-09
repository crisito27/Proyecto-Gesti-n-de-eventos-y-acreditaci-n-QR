/* DetalleEvento — ficha ampliada del evento.

   Usa el elemento nativo <dialog>, que aporta el foco atrapado y
   el cierre con Escape sin código adicional. */

import { useEffect, useRef } from "react";
import ClimaEvento from "./ClimaEvento";
import { formatearFecha, formatearPrecio } from "../utils/formato";

export default function DetalleEvento({ evento, onInscribirse, onCerrar }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const nodo = dialogo.current;
    nodo.showModal();
    return () => nodo.close();
  }, []);

  return (
    <dialog
      ref={dialogo}
      className="detalle-dialogo"
      aria-labelledby="titulo-detalle"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <div className="modal-cabecera">
        <h2 id="titulo-detalle" className="h4 mb-0">
          {evento.nombre}
        </h2>
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar detalle"
          onClick={onCerrar}
        />
      </div>

      <div className="modal-cuerpo">
        <p>{evento.descripcion}</p>

        <dl>
          <dt>Fecha</dt>
          <dd>{formatearFecha(evento.fecha)}</dd>
          <dt>Lugar</dt>
          <dd>{evento.lugar}</dd>
          <dt>Organizador</dt>
          <dd>{evento.organizador}</dd>
          <dt>Categoría</dt>
          <dd>{evento.categoria}</dd>
          <dt>Ambiente</dt>
          <dd>{evento.exterior ? "Al aire libre" : "Interior"}</dd>
          <dt>Valor</dt>
          <dd>{formatearPrecio(evento.precio)}</dd>
          <dt>Cupos disponibles</dt>
          <dd>
            {evento.cupos_disponibles} de {evento.aforo_max}
          </dd>
        </dl>

        <div className="mb-3">
          <ClimaEvento eventoId={evento.id} />
        </div>

        <div className="d-flex flex-wrap justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>
            Volver
          </button>
          <button
            type="button"
            className="btn btn-primary-brand"
            disabled={evento.agotado}
            onClick={() => onInscribirse(evento.id)}
          >
            {evento.agotado ? "Agotado" : "Inscribirme"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
