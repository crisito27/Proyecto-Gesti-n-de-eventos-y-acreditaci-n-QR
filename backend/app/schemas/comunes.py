"""Esquemas transversales: errores, indicadores y clima."""

from datetime import date

from pydantic import BaseModel


class ErrorSalida(BaseModel):
    """Forma única de todos los errores de la API.

    Nunca incluye trazas ni detalles internos: sólo un código estable que el
    frontend puede interpretar y un mensaje legible para la persona.
    """

    codigo: str
    mensaje: str


class IndicadorEvento(BaseModel):
    evento_id: int
    nombre: str
    fecha: date
    aforo_max: int
    inscritos: int
    confirmados: int
    acreditados: int
    cupos_disponibles: int
    ocupacion_pct: float
    recaudado: float


class IndicadoresSalida(BaseModel):
    total_eventos: int
    eventos_publicados: int
    total_inscripciones: int
    total_acreditados: int
    recaudacion_total: float
    por_evento: list[IndicadorEvento]


class ClimaSalida(BaseModel):
    """Respuesta de la API pública Open-Meteo, normalizada por el backend."""

    fecha: date
    temp_min: float
    temp_max: float
    codigo_wmo: int
    descripcion: str
