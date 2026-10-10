/* Ticket — entrada digital con su código QR.
   El QR se genera en el navegador con qrcode.react, que recibe
   el código de la inscripción y devuelve un SVG. */

import { QRCodeSVG } from "qrcode.react";
import { formatearFecha } from "../utils/formato";

function Ticket({ inscripcion, evento, participante }) {
  const asistio = inscripcion.estado === "asistio";

  return (
    <article className="ticket">
      <div className="ticket-info">
        <p className="ticket-eyebrow">ENTRADA DIGITAL</p>
        <h2 className="h5 mb-1">{evento.nombre}</h2>
        <p className="ticket-participante small">
          Inscrito por: {participante.nombre}
        </p>

        <ul className="ticket-meta">
          <li>
            <i className="bi bi-calendar-event"></i>
            {formatearFecha(evento.fecha)}
          </li>
          <li>
            <i className="bi bi-geo-alt"></i>
            {evento.lugar}
          </li>
          <li>
            <i className="bi bi-envelope"></i>
            {participante.email}
          </li>
        </ul>

        {/* Renderizado condicional según el estado de la inscripción */}
        <span
          className={
            "badge ticket-estado " +
            (asistio ? "text-bg-success" : "text-bg-warning")
          }
        >
          {asistio ? "Asistencia registrada" : "Inscrito — pendiente de check-in"}
        </span>
      </div>

      <div className="ticket-stub">
        <div className="ticket-qr">
          <QRCodeSVG value={inscripcion.codigo} size={120} />
        </div>
        <p className="ticket-codigo mb-0">{inscripcion.codigo}</p>
      </div>
    </article>
  );
}

export default Ticket;
