/* =========================================================
   formato.js — funciones auxiliares de presentación.

   Nota de la migración al Hito 3: aquí vivía `generarCodigo`.
   Se eliminó porque generar el código de acreditación en el
   navegador es inseguro: el código es la credencial de acceso al
   evento. Ahora lo genera el backend con `secrets.token_hex`.
   ========================================================= */

/** "2026-11-14" -> "14 de noviembre de 2026" */
export function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return fecha.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Fecha y hora de un ISO completo, para la bitácora de accesos. */
export function formatearFechaHora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** 5000 -> "$5.000" ; 0 -> "Gratuito" */
export function formatearPrecio(valor) {
  const numero = Number(valor ?? 0);
  if (numero === 0) return "Gratuito";
  return numero.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

/** Etiquetas legibles para los estados que devuelve la API. */
export const ETIQUETA_ESTADO_INSCRIPCION = {
  pendiente_pago: "Pendiente de pago",
  confirmada: "Confirmada",
  acreditada: "Asistencia registrada",
  cancelada: "Cancelada",
};

export const CLASE_ESTADO_INSCRIPCION = {
  pendiente_pago: "text-bg-warning",
  confirmada: "text-bg-primary",
  acreditada: "text-bg-success",
  cancelada: "text-bg-secondary",
};

export const ETIQUETA_ESTADO_EVENTO = {
  borrador: "Borrador",
  publicado: "Publicado",
  cancelado: "Cancelado",
};

export const ETIQUETA_RESULTADO_ACCESO = {
  acreditado: "Acreditado",
  duplicado: "Entrada ya usada",
  codigo_invalido: "Código inválido",
  sin_pago: "Sin pago confirmado",
  cancelada: "Inscripción cancelada",
  evento_no_publicado: "Evento no publicado",
};

export const CLASE_RESULTADO_ACCESO = {
  acreditado: "text-bg-success",
  duplicado: "text-bg-warning",
  codigo_invalido: "text-bg-danger",
  sin_pago: "text-bg-warning",
  cancelada: "text-bg-secondary",
  evento_no_publicado: "text-bg-secondary",
};
