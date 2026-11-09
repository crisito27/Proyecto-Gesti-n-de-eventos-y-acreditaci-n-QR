"""Endpoint de indicadores del panel del organizador."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.comunes import IndicadoresSalida
from app.services import indicador_service

router = APIRouter(tags=["Indicadores"])


@router.get("/indicadores", response_model=IndicadoresSalida, summary="Indicadores de aforo")
def indicadores(db: Session = Depends(get_db)):
    """Totales del sistema y detalle por evento.

    Todos los valores se calculan con consultas agregadas sobre PostgreSQL en
    el momento de la petición.
    """
    return indicador_service.calcular(db)
