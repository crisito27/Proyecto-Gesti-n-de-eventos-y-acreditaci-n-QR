/* =========================================================
   App.jsx — componente raíz.

   Concentra el estado que más de una pantalla necesita:
   participantes, inscripciones, la vista activa y el modal.
   Los datos iniciales de los eventos vienen de un archivo JSON
   local (no hay backend).

   Decisión de modelo: el número de inscritos NO se guarda como
   un contador aparte. "aforoBase" son las inscripciones previas
   simuladas, y a eso se le suman las inscripciones hechas en la
   sesión. Así existe una sola fuente de verdad y los números del
   listado y del dashboard nunca pueden contradecirse.
   ========================================================= */

import { useEffect, useState } from "react";
import eventosIniciales from "./data/eventos.json";
import { generarCodigo } from "./utils/formato";

import Navbar from "./components/Navbar";
import ModalInscripcion from "./components/ModalInscripcion";
import Eventos from "./pages/Eventos";
import MiEntrada from "./pages/MiEntrada";
import Organizador from "./pages/Organizador";

const CLAVE_ALMACENAMIENTO = "acreditaqr-estado";

// Lee el estado guardado en el navegador. Va dentro de try/catch
// porque localStorage puede fallar o contener datos corruptos.
function leerEstadoGuardado() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function App() {
  // Se lee localStorage una sola vez al montar el componente.
  // useState con función evita repetir JSON.parse en cada render.
  const [estadoInicial] = useState(leerEstadoGuardado);

  const [vista, setVista] = useState("eventos");
  const [participantes, setParticipantes] = useState(
    estadoInicial?.participantes ?? []
  );
  const [inscripciones, setInscripciones] = useState(
    estadoInicial?.inscripciones ?? []
  );
  const [inscripcionActualId, setInscripcionActualId] = useState(
    estadoInicial?.inscripcionActualId ?? null
  );

  // Evento para el que está abierto el modal (null = modal cerrado).
  const [eventoAInscribir, setEventoAInscribir] = useState(null);

  // Persistencia simple en el navegador: cada vez que cambian las
  // inscripciones o los participantes, se guarda el estado.
  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE_ALMACENAMIENTO,
        JSON.stringify({ participantes, inscripciones, inscripcionActualId })
      );
    } catch {
      // Si el navegador bloquea el almacenamiento, la aplicación
      // sigue funcionando: sólo se pierde al recargar.
    }
  }, [participantes, inscripciones, inscripcionActualId]);

  // ---- Funciones de consulta (datos derivados) ----

  function buscarEvento(id) {
    return eventosIniciales.find((evento) => evento.id === id);
  }

  function buscarParticipante(id) {
    return participantes.find((persona) => persona.id === id);
  }

  function contarInscritos(eventoId) {
    const evento = buscarEvento(eventoId);
    const nuevas = inscripciones.filter((i) => i.eventoId === eventoId).length;
    return evento.aforoBase + nuevas;
  }

  // ---- Acciones ----

  function abrirInscripcion(eventoId) {
    setEventoAInscribir(buscarEvento(eventoId));
  }

  function confirmarInscripcion(datosFormulario) {
    const nuevoParticipante = {
      id: Date.now(),
      ...datosFormulario,
    };

    const nuevaInscripcion = {
      id: Date.now() + 1,
      eventoId: eventoAInscribir.id,
      participanteId: nuevoParticipante.id,
      codigo: generarCodigo(),
      estado: "inscrito",
    };

    // Nunca se modifica el array existente: se crea uno nuevo.
    // Si mutáramos el array, React no detectaría el cambio.
    setParticipantes((actuales) => [...actuales, nuevoParticipante]);
    setInscripciones((actuales) => [...actuales, nuevaInscripcion]);
    setInscripcionActualId(nuevaInscripcion.id);

    setEventoAInscribir(null);
    setVista("mientrada");
  }

  function confirmarAsistencia(inscripcionId) {
    setInscripciones((actuales) =>
      actuales.map((inscripcion) =>
        inscripcion.id === inscripcionId
          ? { ...inscripcion, estado: "asistio" }
          : inscripcion
      )
    );
  }

  // ---- Datos para la vista "Mi entrada" ----

  const inscripcionActual =
    inscripciones.find((i) => i.id === inscripcionActualId) ?? null;

  return (
    <>
      <Navbar vistaActiva={vista} onCambiarVista={setVista} />

      <main className="container py-4">
        {vista === "eventos" && (
          <Eventos
            eventos={eventosIniciales}
            contarInscritos={contarInscritos}
            onInscribirse={abrirInscripcion}
          />
        )}

        {vista === "mientrada" && (
          <MiEntrada
            inscripcion={inscripcionActual}
            evento={inscripcionActual ? buscarEvento(inscripcionActual.eventoId) : null}
            participante={
              inscripcionActual
                ? buscarParticipante(inscripcionActual.participanteId)
                : null
            }
            onIrAEventos={() => setVista("eventos")}
          />
        )}

        {vista === "organizador" && (
          <Organizador
            eventos={eventosIniciales}
            inscripciones={inscripciones}
            contarInscritos={contarInscritos}
            buscarEvento={buscarEvento}
            buscarParticipante={buscarParticipante}
            onConfirmarAsistencia={confirmarAsistencia}
          />
        )}
      </main>

      <footer className="site-footer py-3">
        <div className="container text-muted small">
          AcreditaQR — Taller Evaluado 2, Desarrollo Web y Móvil.
        </div>
      </footer>

      {/* Renderizado condicional del modal: sólo existe en el DOM
          cuando hay un evento seleccionado. */}
      {eventoAInscribir && (
        <ModalInscripcion
          evento={eventoAInscribir}
          onConfirmar={confirmarInscripcion}
          onCerrar={() => setEventoAInscribir(null)}
        />
      )}
    </>
  );
}

export default App;
