/* Organizador — panel con cuatro subvistas.

   La subvista activa es estado local porque sólo importa dentro de
   esta pantalla. `version` se incrementa tras cada acción que
   modifica datos, y las subvistas lo reciben como dependencia para
   recargar lo que muestran. */

import { useState } from "react";
import CheckIn from "../components/CheckIn";
import Dashboard from "../components/Dashboard";
import PanelEventos from "../components/PanelEventos";
import RegistrosAcceso from "../components/RegistrosAcceso";

const SUBVISTAS = [
  { clave: "eventos", etiqueta: "Mis eventos" },
  { clave: "checkin", etiqueta: "Acreditación" },
  { clave: "dashboard", etiqueta: "Dashboard" },
  { clave: "registros", etiqueta: "Bitácora" },
];

function Organizador({ categorias, organizadores, eventos, onCambio }) {
  const [subvista, setSubvista] = useState("eventos");
  const [version, setVersion] = useState(0);

  function registrarCambio() {
    setVersion((v) => v + 1);
    onCambio?.();
  }

  return (
    <section>
      <h1 className="h4 mb-3">Panel del organizador</h1>

      <div className="d-flex gap-1 mb-4 flex-wrap">
        {SUBVISTAS.map((item) => (
          <button
            key={item.clave}
            type="button"
            className={"btn-subvista" + (subvista === item.clave ? " active" : "")}
            aria-current={subvista === item.clave ? "page" : undefined}
            onClick={() => setSubvista(item.clave)}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>

      {subvista === "eventos" && (
        <PanelEventos
          categorias={categorias}
          organizadores={organizadores}
          onCambio={registrarCambio}
        />
      )}

      {subvista === "checkin" && <CheckIn onAcreditado={registrarCambio} />}

      {subvista === "dashboard" && <Dashboard recargarToken={version} />}

      {subvista === "registros" && (
        <RegistrosAcceso eventos={eventos} recargarToken={version} />
      )}
    </section>
  );
}

export default Organizador;
