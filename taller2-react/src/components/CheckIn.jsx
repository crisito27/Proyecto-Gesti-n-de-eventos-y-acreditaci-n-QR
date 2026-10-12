/* CheckIn — pantalla de acreditación del organizador.

   Tiene estado propio (el código escrito y el resultado de la
   búsqueda) porque nadie más lo necesita. La confirmación sí sube
   al padre, porque modifica las inscripciones de la aplicación. */

import { useState } from "react";

function CheckIn({ inscripciones, buscarEvento, buscarParticipante, onConfirmar }) {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);

  function buscar() {
    const texto = codigo.trim().toUpperCase();

    if (!texto) {
      setResultado({ tipo: "aviso", mensaje: "Ingresa un código para buscar." });
      return;
    }

    const inscripcion = inscripciones.find((i) => i.codigo === texto);

    if (!inscripcion) {
      setResultado({
        tipo: "error",
        mensaje: "No se encontró ninguna entrada con ese código.",
      });
      return;
    }

    if (inscripcion.estado === "asistio") {
      const participante = buscarParticipante(inscripcion.participanteId);
      setResultado({
        tipo: "repetido",
        mensaje: `${participante.nombre} ya registró su asistencia.`,
      });
      return;
    }

    setResultado({ tipo: "encontrado", inscripcion });
  }

  function confirmar(inscripcion) {
    onConfirmar(inscripcion.id);
    setCodigo("");
    setResultado({
      tipo: "ok",
      mensaje: "Asistencia registrada correctamente.",
    });
  }

  return (
    <section className="card-panel p-3 p-md-4">
      <h2 className="h5 mb-1">Acreditación</h2>
      <p className="text-muted small">
        Escribe el código de la entrada para registrar la asistencia.
      </p>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control input-codigo"
          placeholder="EVQR-..."
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
        />
        <button type="button" className="btn btn-primary-brand" onClick={buscar}>
          Buscar
        </button>
      </div>

      {/* Renderizado condicional: cada tipo de resultado se muestra
          de una forma distinta. */}
      {resultado?.tipo === "aviso" && (
        <div className="alert alert-warning">{resultado.mensaje}</div>
      )}

      {resultado?.tipo === "error" && (
        <div className="alert alert-danger">{resultado.mensaje}</div>
      )}

      {resultado?.tipo === "repetido" && (
        <div className="alert alert-info">{resultado.mensaje}</div>
      )}

      {resultado?.tipo === "ok" && (
        <div className="alert alert-success">{resultado.mensaje}</div>
      )}

      {resultado?.tipo === "encontrado" && (
        <div className="alert alert-secondary">
          <p className="mb-1">
            <strong>
              {buscarParticipante(resultado.inscripcion.participanteId).nombre}
            </strong>{" "}
            — {buscarParticipante(resultado.inscripcion.participanteId).email}
          </p>
          <p className="text-muted mb-2 small">
            {buscarEvento(resultado.inscripcion.eventoId).nombre}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-primary-brand"
            onClick={() => confirmar(resultado.inscripcion)}
          >
            Confirmar asistencia
          </button>
        </div>
      )}
    </section>
  );
}

export default CheckIn;
