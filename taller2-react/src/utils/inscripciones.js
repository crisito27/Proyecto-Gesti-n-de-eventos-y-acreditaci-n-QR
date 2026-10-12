// Reglas del dominio: se revisan al confirmar, además del bloqueo visual.
export function validarInscripcion(evento, participantes, inscripciones, email) {
  if (!evento) return "Selecciona un evento válido.";
  const delEvento = inscripciones.filter((i) => i.eventoId === evento.id);
  if (evento.aforoBase + delEvento.length >= evento.aforoMax) {
    return "Este evento ya no tiene cupos disponibles.";
  }
  const normalizado = email.trim().toLowerCase();
  const repetida = delEvento.some((i) => participantes.some((p) =>
    p.id === i.participanteId && p.email.trim().toLowerCase() === normalizado
  ));
  return repetida ? "Ya estás inscrito en este evento con ese correo." : null;
}
