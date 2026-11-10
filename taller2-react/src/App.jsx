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
import LoginOrganizador from "./components/LoginOrganizador";

import { useRecurso } from "./hooks/useRecurso";
import {
  listarCategorias,
  listarEventos,
  listarOrganizadores,
  obtenerEvento,
} from "./services/eventosApi";
import { inscribirse } from "./services/inscripcionesApi";
import { api, MODO_DEMO } from "./services/apiCliente";
import { reiniciarDemo } from "./services/demoApi";

const CLAVE_INSCRIPCION = "acreditaqr-inscripcion-id";
const CLAVE_CODIGO = "acreditaqr-codigo-entrada";
const CLAVE_TOKEN = "acreditaqr-token";

function leerCodigoGuardado() {
  try { return localStorage.getItem(CLAVE_CODIGO) ?? ""; }
  catch { return ""; }
}

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
  const [codigoEntrada, setCodigoEntrada] = useState(leerCodigoGuardado);
  const [organizador, setOrganizador] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(false);
  const [eventoAInscribir, setEventoAInscribir] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  // Catálogos compartidos por varias pantallas: se cargan una vez.
  const categorias = useRecurso(listarCategorias, [], { inicial: [] });
  const organizadores = useRecurso(listarOrganizadores, [], { inicial: [] });
  const eventos = useRecurso(() => listarEventos(), [version], { inicial: [] });

  // La sesión se valida contra la API, no solo por tener un token almacenado.
  useEffect(() => {
    if (MODO_DEMO || !sessionStorage.getItem(CLAVE_TOKEN)) return;
    let vigente = true;
    Promise.resolve().then(() => { if (vigente) setRevisandoSesion(true); });
    api.get("/auth/yo")
      .then((usuario) => { if (vigente && usuario.rol === "organizador") setOrganizador(usuario); })
      .catch(() => { if (vigente) sessionStorage.removeItem(CLAVE_TOKEN); })
      .finally(() => { if (vigente) setRevisandoSesion(false); });
    return () => { vigente = false; };
  }, []);

  function ingresar(sesion) {
    sessionStorage.setItem(CLAVE_TOKEN, sesion.access_token);
    setOrganizador(sesion.usuario);
    registrarCambio();
  }

  function cerrarSesion() {
    sessionStorage.removeItem(CLAVE_TOKEN);
    setOrganizador(null);
    setVista("eventos");
  }

  // Guarda la referencia y el código privado de la última inscripción.
  useEffect(() => {
    try {
      if (inscripcionId) localStorage.setItem(CLAVE_INSCRIPCION, String(inscripcionId));
      else localStorage.removeItem(CLAVE_INSCRIPCION);
      if (codigoEntrada) localStorage.setItem(CLAVE_CODIGO, codigoEntrada);
      else localStorage.removeItem(CLAVE_CODIGO);
    } catch {
      // Si el navegador bloquea el almacenamiento, la aplicación sigue
      // funcionando: sólo se pierde la referencia al recargar.
    }
  }, [inscripcionId, codigoEntrada]);

  const registrarCambio = useCallback(() => setVersion((v) => v + 1), []);

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
    setCodigoEntrada(inscripcion.codigo);
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
      <Navbar vistaActiva={vista} onCambiarVista={setVista}
        organizador={organizador} onCerrarSesion={cerrarSesion} />

      {MODO_DEMO && (
        <div className="container mt-3">
          <div className="alert alert-warning d-flex align-items-start justify-content-between gap-3 flex-wrap" role="status">
            <div>
              <strong>Demostración interactiva — datos ficticios.</strong>
              <div className="small">Esta versión de GitHub Pages guarda eventos, inscripciones y acreditaciones solamente en este navegador. No comparte información con otros usuarios ni utiliza PostgreSQL, MongoDB o el backend real. Para evaluar el Hito 3 Full Stack usa el entorno Docker descrito en el README.</div>
            </div>
            <button className="btn btn-sm btn-outline-dark" type="button" onClick={() => { reiniciarDemo(); window.location.reload(); }}>Reiniciar demo</button>
          </div>
        </div>
      )}

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
            codigoEntrada={codigoEntrada}
            onIrAEventos={() => setVista("eventos")}
            onCambio={registrarCambio}
          />
        )}

        {vista === "organizador" && (MODO_DEMO || organizador) && (
          <Organizador
            categorias={categorias.datos ?? []}
            organizadores={organizadores.datos ?? []}
            eventos={eventos.datos ?? []}
            onCambio={registrarCambio}
          />
        )}

        {vista === "organizador" && !MODO_DEMO && !organizador && (
          revisandoSesion ? <p className="text-muted">Verificando sesión…</p> :
          <LoginOrganizador onIngreso={ingresar} />
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
