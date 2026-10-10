/* Organizador — panel con dos subvistas: acreditación y dashboard.
   La subvista activa es estado local, porque sólo importa dentro
   de esta pantalla. */

import { useState } from "react";
import CheckIn from "../components/CheckIn";
import Dashboard from "../components/Dashboard";

function Organizador({
  eventos,
  inscripciones,
  contarInscritos,
  buscarEvento,
  buscarParticipante,
  onConfirmarAsistencia,
}) {
  const [subvista, setSubvista] = useState("checkin");

  return (
    <section>
      <h1 className="h4 mb-3">Panel del organizador</h1>

      <div className="d-flex gap-1 mb-4">
        <button
          type="button"
          className={"btn-subvista" + (subvista === "checkin" ? " active" : "")}
          onClick={() => setSubvista("checkin")}
        >
          Acreditación
        </button>
        <button
          type="button"
          className={"btn-subvista" + (subvista === "dashboard" ? " active" : "")}
          onClick={() => setSubvista("dashboard")}
        >
          Dashboard
        </button>
      </div>

      {subvista === "checkin" ? (
        <CheckIn
          inscripciones={inscripciones}
          buscarEvento={buscarEvento}
          buscarParticipante={buscarParticipante}
          onConfirmar={onConfirmarAsistencia}
        />
      ) : (
        <Dashboard
          eventos={eventos}
          inscripciones={inscripciones}
          contarInscritos={contarInscritos}
        />
      )}
    </section>
  );
}

export default Organizador;
