"""Endpoints de categorías y eventos."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import EstadoEvento
from app.schemas.comunes import ClimaSalida
from app.schemas.evento import (
    CategoriaCrear,
    CategoriaSalida,
    EventoActualizar,
    EventoCrear,
    EventoSalida,
)
from app.services import clima_service, evento_service

router = APIRouter(tags=["Eventos"])


# --------------------------------------------------------------------------
# Categorías
# --------------------------------------------------------------------------

@router.get("/categorias", response_model=list[CategoriaSalida], summary="Listar categorías")
def listar_categorias(db: Session = Depends(get_db)):
    return evento_service.listar_categorias(db)


@router.post(
    "/categorias",
    response_model=CategoriaSalida,
    status_code=status.HTTP_201_CREATED,
    summary="Crear categoría",
)
def crear_categoria(datos: CategoriaCrear, db: Session = Depends(get_db)):
    return evento_service.crear_categoria(db, datos.nombre)


# --------------------------------------------------------------------------
# Eventos
# --------------------------------------------------------------------------

@router.get("/eventos", response_model=list[EventoSalida], summary="Listar eventos")
def listar_eventos(
    texto: str | None = Query(default=None, description="Busca en nombre y lugar"),
    categoria_id: int | None = Query(default=None),
    estado: EstadoEvento | None = Query(default=None),
    organizador_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Listado con filtros. Cada evento incluye sus cupos calculados."""
    eventos = evento_service.listar_eventos(db, texto, categoria_id, estado, organizador_id)
    return [evento_service.a_salida(db, evento) for evento in eventos]


@router.post(
    "/eventos",
    response_model=EventoSalida,
    status_code=status.HTTP_201_CREATED,
    summary="Crear evento",
)
def crear_evento(datos: EventoCrear, db: Session = Depends(get_db)):
    """Crea un evento en estado **borrador**. No acepta inscripciones hasta publicarse."""
    evento = evento_service.crear_evento(db, datos)
    return evento_service.a_salida(db, evento)


@router.get("/eventos/{evento_id}", response_model=EventoSalida, summary="Obtener un evento")
def obtener_evento(evento_id: int, db: Session = Depends(get_db)):
    return evento_service.a_salida(db, evento_service.obtener_evento(db, evento_id))


@router.put("/eventos/{evento_id}", response_model=EventoSalida, summary="Actualizar evento")
def actualizar_evento(evento_id: int, datos: EventoActualizar, db: Session = Depends(get_db)):
    """Actualización parcial.

    Responde **409** si se intenta dejar el aforo por debajo de los inscritos.
    """
    evento = evento_service.actualizar_evento(db, evento_id, datos)
    return evento_service.a_salida(db, evento)


@router.post(
    "/eventos/{evento_id}/publicar", response_model=EventoSalida, summary="Publicar evento"
)
def publicar_evento(evento_id: int, db: Session = Depends(get_db)):
    """Habilita las inscripciones. Exige que el evento tenga descripción."""
    return evento_service.a_salida(db, evento_service.publicar_evento(db, evento_id))


@router.post(
    "/eventos/{evento_id}/cancelar", response_model=EventoSalida, summary="Cancelar evento"
)
def cancelar_evento(evento_id: int, db: Session = Depends(get_db)):
    """Cancela el evento y, con él, todas sus inscripciones vigentes."""
    return evento_service.a_salida(db, evento_service.cancelar_evento(db, evento_id))


@router.delete(
    "/eventos/{evento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar evento",
)
def eliminar_evento(evento_id: int, db: Session = Depends(get_db)):
    """Sólo se permite si el evento no tiene inscritos. Si los tiene, responde **409**."""
    evento_service.eliminar_evento(db, evento_id)


# --------------------------------------------------------------------------
# API pública consumida desde el backend
# --------------------------------------------------------------------------

@router.get(
    "/eventos/{evento_id}/clima",
    response_model=ClimaSalida | None,
    summary="Pronóstico del día del evento",
)
def clima_evento(evento_id: int, db: Session = Depends(get_db)):
    """Consulta Open-Meteo con las coordenadas y la fecha del evento.

    Devuelve `null` si el evento no tiene coordenadas o si la fecha queda
    fuera del rango de pronóstico. Si el servicio externo falla, responde
    **503**.
    """
    evento = evento_service.obtener_evento(db, evento_id)
    if evento.latitud is None or evento.longitud is None:
        return None
    return clima_service.obtener_pronostico(
        evento.latitud, evento.longitud, evento.fecha.isoformat()
    )
