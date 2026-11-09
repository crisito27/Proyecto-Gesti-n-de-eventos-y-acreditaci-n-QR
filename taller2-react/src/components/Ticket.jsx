/* Ticket — entrada digital con su código QR.

   El código ya no se genera aquí: viene de la API, creado por el
   backend. El QR se dibuja en el navegador a partir de ese código. */

import { QRCodeSVG } from "qrcode.react";
import {
  CLASE_ESTADO_INSCRIPCION,
  ETIQUETA_ESTADO_INSCRIPCION,
  formatearFecha,
} from "../utils/formato";

function Ticket({ inscripcion }) {
  const { evento, usuario, estado, codigo } = inscripcion;

  return (
    <article className="ticket">
      <div className="ticket-info">
        <p className="ticket-eyebrow">ENTRADA DIGITAL</p>
        <h2 className="h5 mb-1">{evento.nombre}</h2>
        <p className="ticket-participante small">Inscrito por: {usuario.nombre}</p>

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
            {usuario.email}
          </li>
        </ul>

        <span className={"badge ticket-estado " + (CLASE_ESTADO_INSCRIPCION[estado] ?? "text-bg-secondary")}>
          {ETIQUETA_ESTADO_INSCRIPCION[estado] ?? estado}
        </span>
      </div>

      <div className="ticket-stub">
        <div className="ticket-qr">
          <QRCodeSVG value={codigo} size={120} />
        </div>
        <p className="ticket-codigo mb-0">{codigo}</p>
      </div>
    </article>
  );
}

export default Ticket;
