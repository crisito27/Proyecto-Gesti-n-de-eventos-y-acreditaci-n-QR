/* ModalInscripcion — formulario de inscripción.

   La validación es de dos niveles, y es deliberado:

     · En el navegador se revisan los formatos, para dar respuesta
       inmediata sin ida y vuelta al servidor.
     · En el backend se revisan otra vez, y además las reglas que
       sólo él puede conocer: si queda cupo, si esa persona ya
       estaba inscrita, si el evento está publicado.

   Las reglas de negocio nunca se validan sólo en el cliente: el
   navegador es manipulable y el aforo cambia mientras el
   formulario está abierto. */

import { useState } from "react";
import ClimaEvento from "./ClimaEvento";
import { formatearFecha, formatearPrecio } from "../utils/formato";

const FORMULARIO_VACIO = { nombre: "", email: "", telefono: "" };

function ModalInscripcion({ evento, onConfirmar, onCerrar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor });
  }

  function validar() {
    const nuevos = {};
    if (formulario.nombre.trim().length < 3) {
      nuevos.nombre = "Ingresa tu nombre completo (mínimo 3 caracteres).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())) {
      nuevos.email = "Ingresa un correo electrónico válido.";
    }
    if (!/^\d{8,12}$/.test(formulario.telefono.trim())) {
      nuevos.telefono = "El teléfono debe tener entre 8 y 12 dígitos.";
    }
    return nuevos;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setErrorServidor(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await onConfirmar({
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        telefono: formulario.telefono.trim(),
      });
    } catch (fallo) {
      // Errores que sólo el backend puede detectar.
      setErrorServidor(fallo);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-inscripcion">
      <div className="modal-caja">
        <div className="modal-cabecera">
          <div>
            <h2 id="titulo-inscripcion" className="h5 mb-1">
              Inscripción
            </h2>
            <p className="text-muted small mb-0">
              {evento.nombre} — {formatearFecha(evento.fecha)}
            </p>
          </div>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
        </div>

        <div className="modal-cuerpo">
          <div className="mb-3">
            <ClimaEvento eventoId={evento.id} />
          </div>

          {evento.precio > 0 && (
            <div className="alert alert-light border small">
              <i className="bi bi-credit-card me-1"></i>
              Este evento tiene un valor de <strong>{formatearPrecio(evento.precio)}</strong>.
              Tu entrada quedará pendiente de pago y podrás pagarla desde "Mi entrada".
            </div>
          )}

          {errorServidor && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-1"></i>
              {errorServidor.message}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate>
            <div className="mb-3">
              <label htmlFor="inscripcion-nombre" className="form-label">
                Nombre completo
              </label>
              <input
                type="text"
                id="inscripcion-nombre"
                className={"form-control" + (errores.nombre ? " is-invalid" : "")}
                value={formulario.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                disabled={enviando}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="inscripcion-email" className="form-label">
                Correo electrónico
              </label>
              <input
                type="email"
                id="inscripcion-email"
                className={"form-control" + (errores.email ? " is-invalid" : "")}
                value={formulario.email}
                onChange={(e) => actualizarCampo("email", e.target.value)}
                disabled={enviando}
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="inscripcion-telefono" className="form-label">
                Teléfono
              </label>
              <input
                type="tel"
                id="inscripcion-telefono"
                className={"form-control" + (errores.telefono ? " is-invalid" : "")}
                placeholder="912345678"
                value={formulario.telefono}
                onChange={(e) => actualizarCampo("telefono", e.target.value)}
                disabled={enviando}
              />
              {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCerrar}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary-brand" disabled={enviando}>
                {enviando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Inscribiendo...
                  </>
                ) : (
                  "Confirmar inscripción"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalInscripcion;
