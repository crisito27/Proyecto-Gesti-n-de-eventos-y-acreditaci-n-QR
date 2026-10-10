/* =========================================================
   formato.js — funciones auxiliares de presentación.
   Se dejan fuera de los componentes para no repetir lógica.
   ========================================================= */

/** "2026-10-14" -> "14 de octubre de 2026" */
export function formatearFecha(fechaISO) {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return fecha.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Genera un código de acreditación único para una inscripción. */
export function generarCodigo() {
  const azar = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVQR-${Date.now().toString(36).toUpperCase()}-${azar}`;
}
