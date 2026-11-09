/* Inscripciones y pagos simulados. */

import { api } from "./apiCliente";

export const listarInscripciones = (filtros = {}) =>
  api.get("/inscripciones", {
    evento_id: filtros.eventoId,
    usuario_id: filtros.usuarioId,
  });

export const obtenerInscripcion = (id) => api.get(`/inscripciones/${id}`);

export const buscarPorCodigo = (codigo) =>
  api.get(`/inscripciones/codigo/${encodeURIComponent(codigo)}`);

/** Inscripción desde el formulario del sitio: crea o reutiliza el usuario. */
export const inscribirse = ({ eventoId, nombre, email, telefono }) =>
  api.post("/inscripciones/publica", {
    evento_id: eventoId,
    nombre,
    email,
    telefono,
  });

export const cancelarInscripcion = (id) => api.post(`/inscripciones/${id}/cancelar`);

/* --- Pagos --- */

export const pagar = (inscripcionId, metodo = "tarjeta") =>
  api.post("/pagos", { inscripcion_id: inscripcionId, metodo });

export const obtenerComprobante = (pagoId) => api.get(`/pagos/${pagoId}/comprobante`);
