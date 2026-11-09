/* Acreditación, bitácora de accesos (MongoDB) e indicadores. */

import { api } from "./apiCliente";

/** Valida un código en la puerta y registra el intento en MongoDB. */
export const acreditar = (codigo, puerta = "principal") =>
  api.post("/acreditaciones", { codigo, puerta });

/** Bitácora de intentos de acceso. Viene de MongoDB. */
export const listarRegistrosAcceso = (eventoId, limite = 50) =>
  api.get("/registros-acceso", { evento_id: eventoId, limite });

/** Resumen agregado por evento, calculado con el pipeline de MongoDB. */
export const resumenParticipacion = (eventoId) =>
  api.get(`/eventos/${eventoId}/participacion`);

/** Indicadores de aforo, calculados en PostgreSQL. */
export const obtenerIndicadores = () => api.get("/indicadores");
