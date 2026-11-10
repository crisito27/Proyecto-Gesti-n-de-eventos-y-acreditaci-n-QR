/* Inscripciones y pagos simulados. */

import { api } from "./apiCliente";

export const listarInscripciones = (filtros = {}) =>
  api.get("/inscripciones", {
    evento_id: filtros.eventoId,
    usuario_id: filtros.usuarioId,
  });

export const obtenerInscripcion = (id, codigo) => api.getConCodigo(`/inscripciones/${id}`, codigo);

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

export const cancelarInscripcion = (id, codigo) => api.postConCodigo(`/inscripciones/${id}/cancelar`, {}, codigo);

/* --- Pagos --- */

export const pagar = (inscripcionId, metodo = "tarjeta", codigo) =>
  api.postConCodigo("/pagos", { inscripcion_id: inscripcionId, metodo }, codigo);

export const obtenerComprobante = (pagoId, codigo) => api.getConCodigo(`/pagos/${pagoId}/comprobante`, codigo);
