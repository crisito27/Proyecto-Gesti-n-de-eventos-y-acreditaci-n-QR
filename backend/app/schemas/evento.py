"""DTO de categorías y eventos."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models import EstadoEvento


class CategoriaCrear(BaseModel):
    nombre: str = Field(min_length=3, max_length=80)


class CategoriaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


class EventoCrear(BaseModel):
    organizador_id: int
    categoria_id: int
    nombre: str = Field(min_length=5, max_length=180)
    descripcion: str = Field(default="", max_length=2000)
    fecha: date
    lugar: str = Field(min_length=3, max_length=180)
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    exterior: bool = False
    aforo_max: int = Field(gt=0, le=100_000)
    precio: Decimal = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)


class EventoActualizar(BaseModel):
    """Todos los campos opcionales: permite actualizaciones parciales."""

    categoria_id: int | None = None
    nombre: str | None = Field(default=None, min_length=5, max_length=180)
    descripcion: str | None = Field(default=None, max_length=2000)
    fecha: date | None = None
    lugar: str | None = Field(default=None, min_length=3, max_length=180)
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    exterior: bool | None = None
    aforo_max: int | None = Field(default=None, gt=0, le=100_000)
    precio: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)


class EventoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organizador_id: int
    categoria_id: int
    nombre: str
    descripcion: str
    fecha: date
    lugar: str
    latitud: float | None
    longitud: float | None
    exterior: bool
    aforo_max: int
    precio: Decimal
    estado: EstadoEvento
    creado_en: datetime

    # Datos derivados que calcula el servicio; no son columnas de la tabla.
    categoria: str | None = None
    organizador: str | None = None
    inscritos: int = 0
    cupos_disponibles: int = 0
    agotado: bool = False
