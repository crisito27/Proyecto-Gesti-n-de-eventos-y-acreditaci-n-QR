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
    """Inscripción con su evento y su asistente, para la vista "Mi entrada".

    `pago_id` y `numero_comprobante` se agregaron para el Hito 4: la
    aplicación móvil necesita poder mostrar el comprobante de una
    inscripción propia, y sin el identificador del pago no tenía cómo
    pedirlo a `/pagos/{id}/comprobante`.
    """

    evento: EventoSalida
    usuario: UsuarioSalida
    pagada: bool = False
    pago_id: int | None = None
    numero_comprobante: str | None = None
