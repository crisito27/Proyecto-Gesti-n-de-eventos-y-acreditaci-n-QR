"""Endpoints de acreditación y de la bitácora guardada en MongoDB."""

from fastapi import APIRouter, Depends, Query
from pymongo.collection import Collection
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.realtime import notificar_cambio
from app.core.mongo import get_registros
from app.schemas.acreditacion import (
    AcreditacionCrear,
    AcreditacionSalida,
    RegistroAccesoSalida,
    ResumenParticipacion,
)
from app.services import acreditacion_service

router = APIRouter(tags=["Acreditación y registros de acceso"])


@router.post(
    "/acreditaciones",
    response_model=AcreditacionSalida,
    summary="Acreditar una entrada en la puerta",
)
def acreditar(
    datos: AcreditacionCrear,
    db: Session = Depends(get_db),
    registros: Collection = Depends(get_registros),
):
    """Valida el código y registra la asistencia.

    Siempre responde **200**: el resultado del intento viaja en el campo
    `resultado`, porque desde el punto de vista del organizador un código
    inválido o duplicado no es un error del sistema sino información
    operativa que debe quedar registrada.

    Todo intento, exitoso o no, se guarda en la colección
    `registros_acceso` de MongoDB.
    """
    resultado = acreditacion_service.acreditar(db, registros, datos.codigo, datos.puerta)
    notificar_cambio("acreditacion.registrada", "acreditaciones")
    return resultado


@router.get(
    "/registros-acceso",
    response_model=list[RegistroAccesoSalida],
    summary="Bitácora de accesos (MongoDB)",
)
def listar_registros(
    evento_id: int | None = Query(default=None),
    limite: int = Query(default=100, ge=1, le=500),
    registros: Collection = Depends(get_registros),
):
    """Últimos intentos de acceso, del más reciente al más antiguo."""
    return acreditacion_service.listar_registros(registros, evento_id, limite)


@router.get(
    "/eventos/{evento_id}/participacion",
    response_model=ResumenParticipacion,
    summary="Resumen de participación (agregación en MongoDB)",
)
def resumen_participacion(
    evento_id: int, registros: Collection = Depends(get_registros)
):
    """Cuenta los intentos por resultado usando el pipeline de agregación de Mongo."""
    return acreditacion_service.resumen_participacion(registros, evento_id)
