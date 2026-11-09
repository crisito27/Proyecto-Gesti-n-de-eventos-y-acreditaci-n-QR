/* CheckIn — pantalla de acreditación en la puerta.

   La validación completa ocurre en el backend: aquí sólo se envía
   el código y se muestra lo que responde. El backend decide si la
   entrada es válida, si ya se usó, si falta el pago o si el código
   no existe, y deja constancia del intento en MongoDB.

   Por eso la respuesta siempre llega con HTTP 200 y un campo
   `resultado`: desde el punto de vista del organizador, un código
   rechazado no es un error del sistema sino información operativa. */

import { useState } from "react";
import { acreditar } from "../services/organizadorApi";
import { formatearFechaHora } from "../utils/formato";

const ESTILO_RESULTADO = {
  acreditado: { clase: "alert-success", icono: "check-circle" },
  duplicado: { clase: "alert-warning", icono: "exclamation-circle" },
  sin_pago: { clase: "alert-warning", icono: "credit-card" },
  cancelada: { clase: "alert-secondary", icono: "slash-circle" },
  evento_no_publicado: { clase: "alert-secondary", icono: "slash-circle" },
  codigo_invalido: { clase: "alert-danger", icono: "x-circle" },
};

function CheckIn({ onAcreditado }) {
  const [codigo, setCodigo] = useState("");
  const [puerta, setPuerta] = useState("principal");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function buscar() {
    const texto = codigo.trim();
    setResultado(null);
    setError(null);

    if (!texto) {
      setError({ message: "Ingresa un código para acreditar." });
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await acreditar(texto, puerta);
      setResultado(respuesta);
      setCodigo("");
      // Si se acreditó, el panel recarga indicadores y bitácora.
      if (respuesta.resultado === "acreditado") onAcreditado?.();
      else onAcreditado?.();
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  }

  const estilo = resultado ? ESTILO_RESULTADO[resultado.resultado] : null;

  return (
    <section className="card-panel p-3 p-md-4">
      <h2 className="h5 mb-1">Acreditación</h2>
      <p className="text-muted small">
        Escribe o escanea el código de la entrada para registrar la asistencia.
      </p>

      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-8">
          <label htmlFor="codigo-acreditacion" className="form-label visually-hidden">
            Código de la entrada
          </label>
          <div className="input-group">
            <input
              type="text"
              id="codigo-acreditacion"
              className="form-control input-codigo"
              placeholder="EVQR-..."
              value={codigo}
              disabled={enviando}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscar();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary-brand"
              onClick={buscar}
              disabled={enviando}
            >
              {enviando ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                "Acreditar"
              )}
            </button>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <label htmlFor="puerta" className="form-label visually-hidden">
            Puerta
          </label>
          <select
            id="puerta"
            className="form-select"
            value={puerta}
            onChange={(e) => setPuerta(e.target.value)}
            disabled={enviando}
          >
            <option value="principal">Puerta principal</option>
            <option value="lateral">Puerta lateral</option>
            <option value="acreditacion">Mesón de acreditación</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-1"></i>
          {error.message}
        </div>
      )}

      {resultado && estilo && (
        <div className={`alert ${estilo.clase}`} role="status">
          <p className="mb-1">
            <i className={`bi bi-${estilo.icono} me-2`}></i>
            <strong>{resultado.mensaje}</strong>
          </p>
          <p className="small mb-0 text-muted">
            Código <code>{resultado.codigo}</code>
            {resultado.evento && <> · {resultado.evento}</>}
            {resultado.acreditada_en && (
              <> · {formatearFechaHora(resultado.acreditada_en)}</>
            )}
          </p>
        </div>
      )}

      <p className="text-muted small mb-0">
        <i className="bi bi-info-circle me-1"></i>
        Todo intento, aceptado o rechazado, queda registrado en la bitácora de accesos.
      </p>
    </section>
  );
}

export default CheckIn;
