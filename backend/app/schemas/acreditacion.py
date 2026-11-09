"""DTO de acreditación y de los registros de acceso guardados en MongoDB."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class AcreditacionCrear(BaseModel):
    """Lo que envía la pantalla de acreditación del organizador."""

    codigo: str = Field(min_length=4, max_length=40)
    puerta: str = Field(default="principal", max_length=40)


ResultadoAcceso = Literal[
    "acreditado",        # entrada válida, asistencia registrada
    "codigo_invalido",   # el código no existe
    "duplicado",         # la entrada ya se había usado
    "sin_pago",          # inscripción sin pago confirmado
    "cancelada",         # la inscripción fue cancelada
    "evento_no_publicado",
]


class AcreditacionSalida(BaseModel):
    resultado: ResultadoAcceso
    mensaje: str
    codigo: str
    inscripcion_id: int | None = None
    asistente: str | None = None
    evento: str | None = None
    acreditada_en: datetime | None = None


class RegistroAccesoSalida(BaseModel):
    """Documento de la colección `registros_acceso` de MongoDB."""

    id: str
    evento_id: int | None
    inscripcion_id: int | None
    codigo: str
    resultado: ResultadoAcceso
    puerta: str
    ocurrido_en: datetime
    detalle: dict[str, Any] = {}


class ResumenParticipacion(BaseModel):
    """Agregación calculada en MongoDB con el pipeline de agregación."""

    evento_id: int
    total_intentos: int
    acreditados: int
    duplicados: int
    codigos_invalidos: int
    otros_rechazos: int
    primer_acceso: datetime | None
    ultimo_acceso: datetime | None
