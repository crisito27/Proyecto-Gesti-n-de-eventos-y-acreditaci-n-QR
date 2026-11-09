"""DTO de pagos simulados y comprobantes.

No hay pasarela de pago real: el sistema simula la transacción y emite un
comprobante con número correlativo, que es lo que pide el caso.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models import EstadoPago, MetodoPago


class PagoCrear(BaseModel):
    inscripcion_id: int
    metodo: MetodoPago = MetodoPago.TARJETA


class PagoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inscripcion_id: int
    monto: Decimal
    metodo: MetodoPago
    estado: EstadoPago
    numero_comprobante: str
    pagado_en: datetime | None
    creado_en: datetime


class ComprobanteSalida(BaseModel):
    """Comprobante que el asistente ve o descarga tras pagar."""

    numero_comprobante: str
    emitido_en: datetime
    evento: str
    fecha_evento: str
    lugar: str
    asistente: str
    email: str
    codigo_acreditacion: str
    monto: Decimal
    metodo: MetodoPago
    estado: EstadoPago
