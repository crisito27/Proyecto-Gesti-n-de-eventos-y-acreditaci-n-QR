/* MiEntrada — muestra la última entrada generada, o un estado
   vacío si la persona todavía no se ha inscrito en nada. */

import Ticket from "../components/Ticket";

function MiEntrada({ inscripcion, evento, participante, onIrAEventos }) {
  if (!inscripcion) {
    return (
      <div className="empty-state text-center py-5">
        <i className="bi bi-ticket-perforated display-4"></i>
        <p className="mt-3 text-muted">
          Aún no tienes una entrada. Inscríbete en un evento para generar tu
          código QR.
        </p>
        <button type="button" className="btn btn-primary-brand" onClick={onIrAEventos}>
          Ver eventos disponibles
        </button>
      </div>
    );
  }

  return (
    <section>
      <h1 className="h4 mb-3">Mi entrada</h1>
      <Ticket
        inscripcion={inscripcion}
        evento={evento}
        participante={participante}
      />
      <p className="text-muted small mt-3">
        Presenta este código en la entrada del evento para registrar tu
        asistencia.
      </p>
    </section>
  );
}

export default MiEntrada;
