/* Operaciones de catálogo: categorías, organizadores y eventos. */

import { api } from "./apiCliente";

export const listarCategorias = () => api.get("/categorias");

export const listarOrganizadores = () => api.get("/organizadores");

export const listarEventos = (filtros = {}) =>
  api.get("/eventos", {
    texto: filtros.texto,
    categoria_id: filtros.categoriaId,
    estado: filtros.estado,
    organizador_id: filtros.organizadorId,
  });

export const obtenerEvento = (id) => api.get(`/eventos/${id}`);

export const crearEvento = (datos) => api.post("/eventos", datos);

export const actualizarEvento = (id, datos) => api.put(`/eventos/${id}`, datos);

export const publicarEvento = (id) => api.post(`/eventos/${id}/publicar`);

export const cancelarEvento = (id) => api.post(`/eventos/${id}/cancelar`);

export const eliminarEvento = (id) => api.delete(`/eventos/${id}`);

/* API pública (Open-Meteo), consumida a través del backend. */
export const obtenerClima = (eventoId) => api.get(`/eventos/${eventoId}/clima`);
