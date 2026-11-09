/* Comprobante — boleta del pago simulado.

   Lo emite el backend con un número correlativo (CMP-AAAA-NNNNNN)
   y se guarda en PostgreSQL, de modo que puede recuperarse después
   aunque se cierre el navegador. */

import { formatearFechaHora, formatearPrecio } from "../utils/formato";

const METODO = {
  tarjeta: "Tarjeta (simulada)",
  transferencia: "Transferencia (simulada)",
  gratuito: "Sin costo",
};

function Comprobante({ comprobante }) {
  return (
    <section className="card-panel p-3 p-md-4 mt-3" aria-labelledby="titulo-comprobante">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <p className="ticket-eyebrow mb-1">COMPROBANTE DE PAGO</p>
          <h2 id="titulo-comprobante" className="h6 mb-0">
            {comprobante.numero_comprobante}
          </h2>
        </div>
        <span className="badge text-bg-success align-self-center">
          <i className="bi bi-check-circle me-1"></i>
          Pagado
        </span>
      </div>

      <hr />

      <dl className="row mb-0 small">
        <dt className="col-5 col-sm-4 text-muted fw-normal">Emitido</dt>
        <dd className="col-7 col-sm-8">{formatearFechaHora(comprobante.emitido_en)}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Evento</dt>
        <dd className="col-7 col-sm-8">{comprobante.evento}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Lugar</dt>
        <dd className="col-7 col-sm-8">{comprobante.lugar}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Asistente</dt>
        <dd className="col-7 col-sm-8">{comprobante.asistente}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Correo</dt>
        <dd className="col-7 col-sm-8">{comprobante.email}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Código de entrada</dt>
        <dd className="col-7 col-sm-8">
          <code>{comprobante.codigo_acreditacion}</code>
        </dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Método</dt>
        <dd className="col-7 col-sm-8">{METODO[comprobante.metodo] ?? comprobante.metodo}</dd>

        <dt className="col-5 col-sm-4 text-muted fw-normal">Monto</dt>
        <dd className="col-7 col-sm-8 fw-semibold">{formatearPrecio(comprobante.monto)}</dd>
      </dl>

      <p className="text-muted small mt-3 mb-0">
        Transacción simulada con fines académicos. No corresponde a un cobro real.
      </p>
    </section>
  );
}

export default Comprobante;
