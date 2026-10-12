import { useEffect, useRef } from "react";
import { formatearFecha } from "../utils/formato";

export default function DetalleEvento({ evento, inscritos, onInscribirse, onCerrar }) {
  const dialogo = useRef(null);
  const cupos = Math.max(0, evento.aforoMax - inscritos);

  useEffect(() => {
    const nodo = dialogo.current;
    nodo.showModal();
    return () => nodo.close();
  }, []);

  return (
    <dialog ref={dialogo} className="detalle-dialogo" aria-labelledby="titulo-detalle"
      onCancel={(e) => { e.preventDefault(); onCerrar(); }}>
      <div className="modal-cabecera">
        <h2 id="titulo-detalle" className="h4 mb-0">{evento.nombre}</h2>
        <button type="button" className="btn-close" aria-label="Cerrar detalle" onClick={onCerrar} />
      </div>
      <div className="modal-cuerpo">
        <p>{evento.descripcion}</p>
        <dl>
          <dt>Fecha</dt><dd>{formatearFecha(evento.fecha)}</dd>
          <dt>Lugar</dt><dd>{evento.lugar}</dd>
          <dt>Organizador</dt><dd>{evento.organizador}</dd>
          <dt>Categoría</dt><dd>{evento.categoria}</dd>
          <dt>Ambiente</dt><dd>{evento.exterior ? "Al aire libre" : "Interior"}</dd>
          <dt>Cupos disponibles</dt><dd>{cupos} de {evento.aforoMax}</dd>
        </dl>
        <div className="d-flex flex-wrap justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>Volver</button>
          <button type="button" className="btn btn-primary-brand" disabled={cupos === 0}
            onClick={() => onInscribirse(evento.id)}>{cupos ? "Inscribirme" : "Agotado"}</button>
        </div>
      </div>
    </dialog>
  );
}
