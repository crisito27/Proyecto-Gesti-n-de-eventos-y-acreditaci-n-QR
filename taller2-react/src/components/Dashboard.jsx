/* Dashboard — indicadores de aforo por evento.

   No guarda nada en estado: todos los números se calculan a
   partir de los eventos y las inscripciones que recibe por props.
   Si el estado cambia en App.jsx, React vuelve a renderizar este
   componente con los valores nuevos. */

import { formatearFecha } from "../utils/formato";

function Dashboard({ eventos, inscripciones, contarInscritos }) {
  return (
    <section>
      <h2 className="h5 mb-3">Dashboard de aforo</h2>

      <div className="row g-3">
        {eventos.map((evento) => {
          const inscritos = contarInscritos(evento.id);
          const asistieron = inscripciones.filter(
            (i) => i.eventoId === evento.id && i.estado === "asistio"
          ).length;
          const restantes = Math.max(evento.aforoMax - inscritos, 0);
          const porcentaje = Math.round((inscritos / evento.aforoMax) * 100);

          let claseBarra = "progress-bar dash-barra";
          if (porcentaje >= 100) {
            claseBarra += " aforo-lleno";
          } else if (porcentaje >= 75) {
            claseBarra += " aforo-alto";
          }

          return (
            <div className="col-12 col-md-6" key={evento.id}>
              <div className="card-panel p-3 h-100">
                <h3 className="h6 mb-1">{evento.nombre}</h3>
                <p className="text-muted small mb-2">
                  {formatearFecha(evento.fecha)}
                </p>

                <div className="progress mb-2">
                  <div
                    className={claseBarra}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={porcentaje}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>

                <div className="d-flex justify-content-between small">
                  <span>
                    <strong>{inscritos}</strong> inscritos
                  </span>
                  <span>
                    <strong>{asistieron}</strong> asistieron
                  </span>
                  <span>
                    <strong>{restantes}</strong> cupos libres
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Dashboard;
