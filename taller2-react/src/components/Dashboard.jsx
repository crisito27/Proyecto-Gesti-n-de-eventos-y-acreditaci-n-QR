/* Dashboard — indicadores de aforo y recaudación.

   Todos los números los calcula el backend con consultas agregadas
   sobre PostgreSQL: el frontend no suma nada. */

import { Recurso } from "./EstadoRecurso";
import { useRecurso } from "../hooks/useRecurso";
import { obtenerIndicadores } from "../services/organizadorApi";
import { formatearFecha, formatearPrecio } from "../utils/formato";

function Totales({ indicadores }) {
  const tarjetas = [
    { etiqueta: "Eventos", valor: indicadores.total_eventos, icono: "calendar3" },
    { etiqueta: "Publicados", valor: indicadores.eventos_publicados, icono: "megaphone" },
    { etiqueta: "Inscripciones", valor: indicadores.total_inscripciones, icono: "people" },
    { etiqueta: "Acreditados", valor: indicadores.total_acreditados, icono: "qr-code-scan" },
    {
      etiqueta: "Recaudado",
      valor: formatearPrecio(indicadores.recaudacion_total),
      icono: "cash-coin",
    },
  ];

  return (
    <div className="row g-2 mb-4">
      {tarjetas.map((tarjeta) => (
        <div className="col-6 col-md" key={tarjeta.etiqueta}>
          <div className="card-panel p-3 h-100 text-center">
            <i className={`bi bi-${tarjeta.icono} text-muted`}></i>
            <p className="stub-aforo-numero mb-0">{tarjeta.valor}</p>
            <p className="stub-aforo-label mb-0">{tarjeta.etiqueta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ recargarToken }) {
  const { datos, cargando, error, recargar } = useRecurso(
    obtenerIndicadores,
    [recargarToken],
  );

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Dashboard de aforo</h2>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={recargar}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualizar
        </button>
      </div>

      <Recurso
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={datos?.por_evento?.length === 0}
        mensajeVacio="Todavía no hay eventos creados."
      >
        {datos && (
          <>
            <Totales indicadores={datos} />

            <div className="row g-3">
              {datos.por_evento.map((fila) => {
                let claseBarra = "progress-bar dash-barra";
                if (fila.ocupacion_pct >= 100) claseBarra += " aforo-lleno";
                else if (fila.ocupacion_pct >= 75) claseBarra += " aforo-alto";

                return (
                  <div className="col-12 col-md-6" key={fila.evento_id}>
                    <div className="card-panel p-3 h-100">
                      <h3 className="h6 mb-1">{fila.nombre}</h3>
                      <p className="text-muted small mb-2">{formatearFecha(fila.fecha)}</p>

                      <div className="progress mb-2">
                        <div
                          className={claseBarra}
                          style={{ width: `${Math.min(fila.ocupacion_pct, 100)}%` }}
                          role="progressbar"
                          aria-valuenow={fila.ocupacion_pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Ocupación de ${fila.nombre}`}
                        ></div>
                      </div>

                      <div className="d-flex justify-content-between small flex-wrap gap-2">
                        <span>
                          <strong>{fila.inscritos}</strong> inscritos
                        </span>
                        <span>
                          <strong>{fila.acreditados}</strong> acreditados
                        </span>
                        <span>
                          <strong>{fila.cupos_disponibles}</strong> libres
                        </span>
                        <span className="text-muted">{formatearPrecio(fila.recaudado)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Recurso>
    </section>
  );
}

export default Dashboard;
