/* ModalInscripcion — formulario de inscripción.

   El modal no usa el JavaScript de Bootstrap: aparece y desaparece
   por renderizado condicional desde el padre. Bootstrap se utiliza
   para estilos y utilidades.

   La validación es propia: cada campo se revisa en el submit y
   los mensajes de error se guardan en estado. */

import { useEffect, useState } from "react";
import { formatearFecha } from "../utils/formato";
import ClimaEvento from "./ClimaEvento";

const FORMULARIO_VACIO = { nombre: "", email: "", telefono: "" };

function ModalInscripcion({ evento, onConfirmar, onCerrar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    function manejarTecla(eventoTeclado) {
      if (eventoTeclado.key === "Escape") {
        onCerrar();
      }
    }

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

  function actualizarCampo(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor });

    if (errores[campo]) {
      setErrores({ ...errores, [campo]: undefined });
    }
  }

  function validar() {
    const nuevosErrores = {};

    if (formulario.nombre.trim().length < 3) {
      nuevosErrores.nombre = "Ingresa tu nombre completo (mínimo 3 caracteres).";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())) {
      nuevosErrores.email = "Ingresa un correo electrónico válido.";
    }

    if (!/^\d{8,12}$/.test(formulario.telefono.trim())) {
      nuevosErrores.telefono = "El teléfono debe tener entre 8 y 12 dígitos.";
    }

    return nuevosErrores;
  }

  function manejarEnvio(e) {
    e.preventDefault();

    const nuevosErrores = validar();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    onConfirmar({
      nombre: formulario.nombre.trim(),
      email: formulario.email.trim(),
      telefono: formulario.telefono.trim(),
    });
  }

  return (
    <div
      className="modal-fondo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-inscripcion"
    >
      <div className="modal-caja">
        <div className="modal-cabecera">
          <div>
            <h2 id="titulo-modal-inscripcion" className="h5 mb-1">
              Inscripción
            </h2>
            <p className="text-muted small mb-0">
              {evento.nombre} — {formatearFecha(evento.fecha)}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar inscripción"
            onClick={onCerrar}
          ></button>
        </div>

        <div className="modal-cuerpo">
          {evento.exterior && (
            <div className="mb-3">
              <ClimaEvento lat={evento.lat} lon={evento.lon} fecha={evento.fecha} />
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
                autoComplete="name"
                required
                aria-invalid={Boolean(errores.nombre)}
                aria-describedby={errores.nombre ? "error-nombre" : undefined}
              />
              {errores.nombre && (
                <div id="error-nombre" className="invalid-feedback">
                  {errores.nombre}
                </div>
              )}
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
                autoComplete="email"
                required
                aria-invalid={Boolean(errores.email)}
                aria-describedby={errores.email ? "error-email" : undefined}
              />
              {errores.email && (
                <div id="error-email" className="invalid-feedback">
                  {errores.email}
                </div>
              )}
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
                autoComplete="tel"
                inputMode="numeric"
                required
                aria-invalid={Boolean(errores.telefono)}
                aria-describedby={errores.telefono ? "error-telefono" : undefined}
              />
              {errores.telefono && (
                <div id="error-telefono" className="invalid-feedback">
                  {errores.telefono}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCerrar}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary-brand">
                Confirmar inscripción
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalInscripcion;
