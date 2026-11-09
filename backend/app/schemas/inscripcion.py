"""DTO de inscripciones."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import EstadoInscripcion
from app.schemas.evento import EventoSalida
from app.schemas.usuario import UsuarioSalida


class InscripcionCrear(BaseModel):
    evento_id: int
    usuario_id: int


class InscripcionSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evento_id: int
    usuario_id: int
    codigo: str
    estado: EstadoInscripcion
    creada_en: datetime
    acreditada_en: datetime | None


class InscripcionDetalle(InscripcionSalida):
    """Inscripción con su evento y su asistente, para la vista "Mi entrada"."""

    evento: EventoSalida
    usuario: UsuarioSalida
    pagada: bool = False
