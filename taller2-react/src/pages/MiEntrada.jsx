/* MiEntrada — entrada del asistente, pago y comprobante.

   La inscripción se recupera desde la API por su id, no desde el
   navegador. En localStorage sólo queda guardado ese id, que es
   una referencia, no los datos: si el organizador acredita la
   entrada desde su panel, al recargar esta pantalla el estado
   aparece actualizado. */

import { useState } from "react";
import Comprobante from "../components/Comprobante";
import Ticket from "../components/Ticket";
import { Recurso, Vacio } from "../components/EstadoRecurso";
import { useRecurso } from "../hooks/useRecurso";
import { obtenerComprobante, obtenerInscripcion, pagar } from "../services/inscripcionesApi";
import { formatearPrecio } from "../utils/formato";

function MiEntrada({ inscripcionId, codigoEntrada, onIrAEventos, onCambio }) {
  const [version, setVersion] = useState(0);
  const [comprobante, setComprobante] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const [metodo, setMetodo] = useState("tarjeta");

  const { datos: inscripcion, cargando, error, recargar } = useRecurso(
    () => obtenerInscripcion(inscripcionId, codigoEntrada),
    [inscripcionId, codigoEntrada, version],
    { activo: Boolean(inscripcionId) },
  );

  if (!inscripcionId) {
    return (
      <Vacio
        icono="ticket-perforated"
        mensaje="Aún no tienes una entrada. Inscríbete en un evento para generar tu código QR."
      >
        <button type="button" className="btn btn-primary-brand" onClick={onIrAEventos}>
          Ver eventos disponibles
        </button>
      </Vacio>
    );
  }

  async function realizarPago() {
    setErrorPago(null);
    setPagando(true);
    try {
      const pago = await pagar(inscripcion.id, metodo, codigoEntrada);
      const datos = await obtenerComprobante(pago.id, codigoEntrada);
      setComprobante(datos);
      setVersion((v) => v + 1); // recarga la inscripción, ya confirmada
      onCambio?.();
    } catch (fallo) {
      setErrorPago(fallo);
    } finally {
      setPagando(false);
    }
  }

  const requierePago =
    inscripcion?.estado === "pendiente_pago" && Number(inscripcion?.evento?.precio) > 0;

  return (
    <section>
      <h1 className="h4 mb-3">Mi entrada</h1>

      <Recurso cargando={cargando} error={error} onReintentar={recargar}>
        {inscripcion && (
          <>
            <Ticket inscripcion={inscripcion} />

            {requierePago && (
              <div className="card-panel p-3 p-md-4 mt-3">
                <h2 className="h6 mb-1">Pago pendiente</h2>
                <p className="text-muted small">
                  Tu entrada está reservada, pero necesita el pago de{" "}
                  <strong>{formatearPrecio(inscripcion.evento.precio)}</strong> para
                  poder acreditarse en la puerta.
                </p>

                {errorPago && (
                  <div className="alert alert-danger" role="alert">
                    {errorPago.message}
                  </div>
                )}

                <div className="row g-2 align-items-end">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="metodo-pago" className="form-label">
                      Método de pago
                    </label>
                    <select
                      id="metodo-pago"
                      className="form-select"
                      value={metodo}
                      onChange={(e) => setMetodo(e.target.value)}
                      disabled={pagando}
                    >
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 d-grid">
                    <button
                      type="button"
                      className="btn btn-primary-brand"
                      onClick={realizarPago}
                      disabled={pagando}
                    >
                      {pagando ? "Procesando..." : "Pagar y emitir comprobante"}
                    </button>
                  </div>
                </div>

                <p className="text-muted small mt-2 mb-0">
                  Transacción simulada: no se cobra dinero real.
                </p>
              </div>
            )}

            {inscripcion.pagada && !comprobante && (
              <p className="text-success small mt-3">
                <i className="bi bi-check-circle me-1"></i>
                Esta inscripción tiene su pago confirmado.
              </p>
            )}

            {comprobante && <Comprobante comprobante={comprobante} />}

            <p className="text-muted small mt-3">
              Presenta este código en la entrada del evento para registrar tu asistencia.
            </p>
          </>
        )}
      </Recurso>
    </section>
  );
}

export default MiEntrada;
