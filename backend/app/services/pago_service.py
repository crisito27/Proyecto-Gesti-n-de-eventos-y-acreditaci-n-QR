"""Pagos simulados y emisión de comprobantes.

No hay pasarela real ni se procesan medios de pago verdaderos: la transacción
se simula y lo que importa para el dominio es el registro del pago y el
comprobante que habilita la acreditación.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.errores import Conflicto, NoEncontrado, ReglaNegocio
from app.models import EstadoInscripcion, EstadoPago, MetodoPago, Pago
from app.schemas.pago import ComprobanteSalida
from app.services import inscripcion_service


def _siguiente_numero_comprobante(db: Session) -> str:
    """Correlativo del año en curso: CMP-2026-000001."""
    anio = datetime.now(timezone.utc).year
    ultimo = db.scalar(
        select(func.max(Pago.numero_comprobante)).where(
            Pago.numero_comprobante.like(f"CMP-{anio}-%")
        )
    )
    siguiente = int(ultimo.rsplit("-", 1)[-1]) + 1 if ultimo else 1
    return f"CMP-{anio}-{siguiente:06d}"


def obtener_pago(db: Session, pago_id: int) -> Pago:
    pago = db.get(Pago, pago_id)
    if pago is None:
        raise NoEncontrado(f"No existe el pago {pago_id}.")
    return pago


def listar_pagos(db: Session) -> list[Pago]:
    return list(db.scalars(select(Pago).order_by(Pago.creado_en.desc())))


def registrar_pago(db: Session, inscripcion_id: int, metodo: MetodoPago) -> Pago:
    # Un bloqueo transaccional global para comprobantes evita que dos pagos
    # simultáneos calculen el mismo correlativo. PostgreSQL lo libera en commit
    # o rollback; no requiere migraciones ni cambios en la tabla.
    db.execute(text("SELECT pg_advisory_xact_lock(:clave)"), {"clave": 7267001})
    inscripcion = inscripcion_service.obtener_inscripcion(db, inscripcion_id)

    if inscripcion.estado == EstadoInscripcion.CANCELADA:
        raise ReglaNegocio(
            "No se puede pagar una inscripción cancelada.", codigo="inscripcion_cancelada"
        )
    if inscripcion.pago is not None and inscripcion.pago.estado == EstadoPago.PAGADO:
        raise Conflicto(
            "Esta inscripción ya tiene un pago registrado.", codigo="pago_duplicado"
        )

    monto: Decimal = inscripcion.evento.precio

    pago = Pago(
        inscripcion_id=inscripcion.id,
        monto=monto,
        metodo=MetodoPago.GRATUITO if monto == 0 else metodo,
        estado=EstadoPago.PAGADO,  # la pasarela simulada siempre aprueba
        numero_comprobante=_siguiente_numero_comprobante(db),
        pagado_en=datetime.now(timezone.utc),
    )
    db.add(pago)

    # Pagar confirma la inscripción: recién ahí puede acreditarse en la puerta.
    if inscripcion.estado == EstadoInscripcion.PENDIENTE_PAGO:
        inscripcion.estado = EstadoInscripcion.CONFIRMADA

    db.commit()
    db.refresh(pago)
    return pago


def generar_comprobante(db: Session, pago_id: int) -> ComprobanteSalida:
    pago = obtener_pago(db, pago_id)
    inscripcion = pago.inscripcion
    evento = inscripcion.evento
    usuario = inscripcion.usuario

    return ComprobanteSalida(
        numero_comprobante=pago.numero_comprobante,
        emitido_en=pago.pagado_en or pago.creado_en,
        evento=evento.nombre,
        fecha_evento=evento.fecha.isoformat(),
        lugar=evento.lugar,
        asistente=usuario.nombre,
        email=usuario.email,
        codigo_acreditacion=inscripcion.codigo,
        monto=pago.monto,
        metodo=pago.metodo,
        estado=pago.estado,
    )
