"""Endpoints de pagos simulados y comprobantes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pago import ComprobanteSalida, PagoCrear, PagoSalida
from app.services import pago_service

router = APIRouter(tags=["Pagos simulados"])


@router.get("/pagos", response_model=list[PagoSalida], summary="Listar pagos")
def listar_pagos(db: Session = Depends(get_db)):
    return pago_service.listar_pagos(db)


@router.post(
    "/pagos",
    response_model=PagoSalida,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un pago simulado",
)
def registrar_pago(datos: PagoCrear, db: Session = Depends(get_db)):
    """Simula el cobro y confirma la inscripción.

    No hay pasarela real: la transacción se aprueba siempre y se emite un
    comprobante con número correlativo. Responde **409** si la inscripción ya
    tenía un pago registrado y **422** si está cancelada.
    """
    return pago_service.registrar_pago(db, datos.inscripcion_id, datos.metodo)


@router.get("/pagos/{pago_id}", response_model=PagoSalida, summary="Obtener un pago")
def obtener_pago(pago_id: int, db: Session = Depends(get_db)):
    return pago_service.obtener_pago(db, pago_id)


@router.get(
    "/pagos/{pago_id}/comprobante",
    response_model=ComprobanteSalida,
    summary="Comprobante del pago",
)
def comprobante(pago_id: int, db: Session = Depends(get_db)):
    """Comprobante que el asistente ve junto a su entrada."""
    return pago_service.generar_comprobante(db, pago_id)
