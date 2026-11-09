/* =========================================================
   App.jsx — componente raíz.

   Qué cambió respecto del Taller 2
   --------------------------------
   Antes esta aplicación era la dueña de los datos: los eventos
   venían de un JSON incluido en el bundle, las inscripciones
   vivían en un array del estado de React y se guardaban en
   localStorage.

   Ahora la fuente de verdad es la API. App.jsx ya no almacena
   eventos ni inscripciones: carga los catálogos que varias
   pantallas comparten (categorías, organizadores, eventos) y
   coordina la navegación.

   Lo único que queda en localStorage es el **id** de la última
   inscripción hecha en este navegador. No son datos, es una
   referencia: sirve para que "Mi entrada" sepa qué pedirle a la
   API después de recargar la página. En un sistema con cuentas de
   usuario esto lo reemplazaría la sesión.
   ========================================================= */

import { useCallback, useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import DetalleEvento from "./components/DetalleEvento";
import ModalInscripcion from "./components/ModalInscripcion";
import { ErrorCarga } from "./components/EstadoRecurso";
import Eventos from "./pages/Eventos";
import MiEntrada from "./pages/MiEntrada";
import Organizador from "./pages/Organizador";

import { useRecurso } from "./hooks/useRecurso";
import { useTiempoReal } from "./hooks/useTiempoReal";
import {
  listarCategorias,
  listarEventos,
  listarOrganizadores,
  obtenerEvento,
} from "./services/eventosApi";
import { inscribirse } from "./services/inscripcionesApi";

const CLAVE_INSCRIPCION = "acreditaqr-inscripcion-id";

function leerInscripcionGuardada() {
  try {
    const valor = localStorage.getItem(CLAVE_INSCRIPCION);
    return valor ? Number(valor) : null;
  } catch {
    return null;
  }
}

function App() {
  const [vista, setVista] = useState("eventos");
  const [version, setVersion] = useState(0);

  const [inscripcionId, setInscripcionId] = useState(leerInscripcionGuardada);
  const [eventoAInscribir, setEventoAInscribir] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  // Catálogos compartidos por varias pantallas: se cargan una vez.
  const categorias = useRecurso(listarCategorias, [], { inicial: [] });
  const organizadores = useRecurso(listarOrganizadores, [], { inicial: [] });
  const eventos = useRecurso(() => listarEventos(), [version], { inicial: [] });

  // Guarda sólo la referencia a la última inscripción.
  useEffect(() => {
    try {
      if (inscripcionId) localStorage.setItem(CLAVE_INSCRIPCION, String(inscripcionId));
      else localStorage.removeItem(CLAVE_INSCRIPCION);
    } catch {
      // Si el navegador bloquea el almacenamiento, la aplicación sigue
      // funcionando: sólo se pierde la referencia al recargar.
    }
  }, [inscripcionId]);

  const registrarCambio = useCallback(() => setVersion((v) => v + 1), []);
  const estadoRealtime = useTiempoReal((evento) => {
    if (evento?.tipo) registrarCambio();
  });

  async function abrirInscripcion(eventoId) {
    setEventoDetalle(null);
    // Se vuelve a pedir el evento para tener el cupo al día en el
    // momento de abrir el formulario.
    const evento = await obtenerEvento(eventoId);
    setEventoAInscribir(evento);
  }

  async function confirmarInscripcion(datos) {
    const inscripcion = await inscribirse({
      eventoId: eventoAInscribir.id,
      ...datos,
    });
    setInscripcionId(inscripcion.id);
    setEventoAInscribir(null);
    setVista("mientrada");
    registrarCambio();
  }

  async function verDetalle(eventoId) {
    const evento = await obtenerEvento(eventoId);
    setEventoDetalle(evento);
  }

  const errorCatalogos = categorias.error ?? organizadores.error;

  return (
    <>
      <Navbar vistaActiva={vista} onCambiarVista={setVista} />
      <div className="container small text-end text-muted" role="status" aria-live="polite">
        Sincronización: {estadoRealtime === "conectado" ? "en tiempo real" : estadoRealtime === "conectando" ? "conectando…" : "sin conexión; reintentando"}
      </div>

      <main className="container py-4">
        {errorCatalogos && (
          <ErrorCarga
            error={errorCatalogos}
            onReintentar={() => {
              categorias.recargar();
              organizadores.recargar();
            }}
          />
        )}

        {vista === "eventos" && (
          <Eventos
            categorias={categorias.datos ?? []}
            onInscribirse={abrirInscripcion}
            onVerDetalle={verDetalle}
            recargarToken={version}
          />
        )}

        {vista === "mientrada" && (
          <MiEntrada
            inscripcionId={inscripcionId}
            onIrAEventos={() => setVista("eventos")}
            onCambio={registrarCambio}
          />
        )}

        {vista === "organizador" && (
          <Organizador
            categorias={categorias.datos ?? []}
            organizadores={organizadores.datos ?? []}
            eventos={eventos.datos ?? []}
            onCambio={registrarCambio}
          />
        )}
      </main>

      <footer className="site-footer py-3">
        <div className="container text-muted small">
          AcreditaQR — Hito 3, Plataforma Web Full Stack · Desarrollo Web y Móvil.
        </div>
      </footer>

      {eventoDetalle && (
        <DetalleEvento
          evento={eventoDetalle}
          onInscribirse={abrirInscripcion}
          onCerrar={() => setEventoDetalle(null)}
        />
      )}

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
