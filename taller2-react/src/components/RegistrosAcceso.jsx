/* RegistrosAcceso — bitácora de accesos (MongoDB).

   Esta pantalla es la cara visible de la base documental. Muestra
   dos cosas que vienen de MongoDB:

     · el resumen por evento, calculado con el pipeline de
       agregación ($match + $group);
     · los últimos intentos de acceso, con su resultado y el
       detalle propio de cada caso.

   Es la evidencia de que MongoDB no está sólo conectado, sino
   sosteniendo una funcionalidad real. */

import { useState } from "react";
import { Recurso } from "./EstadoRecurso";
import { useRecurso } from "../hooks/useRecurso";
import { listarRegistrosAcceso, resumenParticipacion } from "../services/organizadorApi";
import {
  CLASE_RESULTADO_ACCESO,
  ETIQUETA_RESULTADO_ACCESO,
  formatearFechaHora,
} from "../utils/formato";

function Resumen({ eventoId, version }) {
  const { datos, cargando, error } = useRecurso(
    () => resumenParticipacion(eventoId),
    [eventoId, version],
    { activo: Boolean(eventoId) },
  );

  if (!eventoId) return null;
  if (cargando || error || !datos) return null;

  const celdas = [
    { etiqueta: "Intentos", valor: datos.total_intentos },
    { etiqueta: "Acreditados", valor: datos.acreditados },
    { etiqueta: "Duplicados", valor: datos.duplicados },
    { etiqueta: "Códigos inválidos", valor: datos.codigos_invalidos },
    { etiqueta: "Otros rechazos", valor: datos.otros_rechazos },
  ];

  return (
    <div className="card-panel p-3 mb-3">
      <p className="small text-muted mb-2">
        <i className="bi bi-database me-1"></i>
        Resumen calculado con el pipeline de agregación de MongoDB
      </p>
      <div className="row g-2 text-center">
        {celdas.map((celda) => (
          <div className="col" key={celda.etiqueta}>
            <p className="stub-aforo-numero mb-0">{celda.valor}</p>
            <p className="stub-aforo-label mb-0">{celda.etiqueta}</p>
          </div>
        ))}
      </div>
      {datos.ultimo_acceso && (
        <p className="text-muted small mb-0 mt-2">
          Último acceso: {formatearFechaHora(datos.ultimo_acceso)}
        </p>
      )}
    </div>
  );
}

function RegistrosAcceso({ eventos, recargarToken }) {
  const [eventoId, setEventoId] = useState("");

  const { datos, cargando, error, recargar } = useRecurso(
    () => listarRegistrosAcceso(eventoId || undefined, 50),
    [eventoId, recargarToken],
    { inicial: [] },
  );

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="h5 mb-0">Bitácora de accesos</h2>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={recargar}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualizar
        </button>
      </div>

      <div className="mb-3">
        <label htmlFor="filtro-evento-registros" className="form-label small text-muted">
          Filtrar por evento
        </label>
        <select
          id="filtro-evento-registros"
          className="form-select"
          value={eventoId}
          onChange={(e) => setEventoId(e.target.value)}
        >
          <option value="">Todos los eventos</option>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      <Resumen eventoId={eventoId} version={recargarToken} />

      <Recurso
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={datos?.length === 0}
        mensajeVacio="Todavía no hay intentos de acceso registrados."
      >
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th scope="col">Momento</th>
                <th scope="col">Código</th>
                <th scope="col">Resultado</th>
                <th scope="col">Puerta</th>
                <th scope="col">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {datos?.map((registro) => (
                <tr key={registro.id}>
                  <td className="small text-nowrap">
                    {formatearFechaHora(registro.ocurrido_en)}
                  </td>
                  <td>
                    <code className="small">{registro.codigo}</code>
                  </td>
                  <td>
                    <span
                      className={
                        "badge " + (CLASE_RESULTADO_ACCESO[registro.resultado] ?? "text-bg-secondary")
                      }
                    >
                      {ETIQUETA_RESULTADO_ACCESO[registro.resultado] ?? registro.resultado}
                    </span>
                  </td>
                  <td className="small">{registro.puerta}</td>
                  <td className="small text-muted">
                    {registro.detalle?.asistente ?? "—"}
                    {registro.detalle?.monto_pendiente != null && (
                      <> · debe ${registro.detalle.monto_pendiente}</>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-muted small">
          Cada documento guarda sólo los campos que corresponden a su caso: un código
          inválido no tiene asistente, y uno rechazado por pago guarda el monto pendiente.
          Esa forma variable es la razón de usar una base documental y no una tabla.
        </p>
      </Recurso>
    </section>
  );
}

export default RegistrosAcceso;
