/* ModalInscripcion — formulario de inscripción.

   El modal NO usa el JavaScript de Bootstrap: aparece y
   desaparece por renderizado condicional desde el padre. Sólo se
   aprovechan las clases visuales de Bootstrap.

   La validación es propia: cada campo se revisa en el submit y
   los mensajes de error se guardan en estado. */

import { useState } from "react";
import { formatearFecha } from "../utils/formato";
import ClimaEvento from "./ClimaEvento";

const FORMULARIO_VACIO = { nombre: "", email: "", telefono: "" };

function ModalInscripcion({ evento, onConfirmar, onCerrar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  function actualizarCampo(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor });
  }

  function validar() {
    const nuevosErrores = {};

    if (formulario.nombre.trim().length < 3) {
      nuevosErrores.nombre = "Ingresa tu nombre completo (mínimo 3 caracteres).";
    }

    // Validación simple: algo, arroba, algo, punto, algo.
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

    // Object.keys sobre el objeto de errores: si está vacío, pasa.
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
    <div className="modal-fondo" role="dialog" aria-modal="true">
      <div className="modal-caja">
        <div className="modal-cabecera">
          <div>
            <h2 className="h5 mb-1">Inscripción</h2>
            <p className="text-muted small mb-0">
              {evento.nombre} — {formatearFecha(evento.fecha)}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={onCerrar}
          ></button>
        </div>

        <div className="modal-cuerpo">
          {/* La API pública se consulta aquí: antes de inscribirse,
              la persona ve qué clima se espera ese día. */}
          <div className="mb-3">
            <ClimaEvento lat={evento.lat} lon={evento.lon} fecha={evento.fecha} />
          </div>

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
              />
              {errores.nombre && (
                <div className="invalid-feedback">{errores.nombre}</div>
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
              />
              {errores.email && (
                <div className="invalid-feedback">{errores.email}</div>
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
              />
              {errores.telefono && (
                <div className="invalid-feedback">{errores.telefono}</div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>
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
