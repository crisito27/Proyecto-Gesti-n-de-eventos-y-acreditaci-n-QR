"""Endpoints de inscripciones."""

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.realtime import notificar_cambio
from app.models import EstadoPago
from app.schemas.evento import EventoSalida
from app.schemas.inscripcion import InscripcionCrear, InscripcionDetalle, InscripcionSalida
from app.schemas.usuario import UsuarioCrear, UsuarioSalida
from app.services import evento_service, inscripcion_service, usuario_service

router = APIRouter(tags=["Inscripciones"])


class InscripcionPublica(BaseModel):
    """Inscripción desde el formulario del sitio.

    El asistente no tiene cuenta previa: se identifica con sus datos y el
    backend reutiliza o crea el usuario según el correo.
    """

    evento_id: int
    nombre: str = Field(min_length=3, max_length=120)
    email: EmailStr
    telefono: str = Field(pattern=r"^\d{8,12}$")


def _a_detalle(db: Session, inscripcion) -> InscripcionDetalle:
    detalle = InscripcionDetalle.model_validate(
        {
            **InscripcionSalida.model_validate(inscripcion).model_dump(),
            "evento": evento_service.a_salida(db, inscripcion.evento),
            "usuario": UsuarioSalida.model_validate(inscripcion.usuario),
            "pagada": inscripcion.pago is not None
            and inscripcion.pago.estado == EstadoPago.PAGADO,
        }
    )
    return detalle


@router.get(
    "/inscripciones", response_model=list[InscripcionSalida], summary="Listar inscripciones"
)
def listar_inscripciones(
    evento_id: int | None = Query(default=None),
    usuario_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return inscripcion_service.listar_inscripciones(db, evento_id, usuario_id)


@router.post(
    "/inscripciones",
    response_model=InscripcionDetalle,
    status_code=status.HTTP_201_CREATED,
    summary="Inscribir a un usuario existente",
)
def crear_inscripcion(datos: InscripcionCrear, db: Session = Depends(get_db)):
    """Responde **409** si ya está inscrito o si el aforo está completo."""
    inscripcion = inscripcion_service.crear_inscripcion(db, datos.evento_id, datos.usuario_id)
    notificar_cambio("inscripcion.creada", "inscripciones", inscripcion.id)
    return _a_detalle(db, inscripcion)


@router.post(
    "/inscripciones/publica",
    response_model=InscripcionDetalle,
    status_code=status.HTTP_201_CREATED,
    summary="Inscripción desde el formulario público",
)
def inscripcion_publica(datos: InscripcionPublica, db: Session = Depends(get_db)):
    """Crea o reutiliza el usuario según el correo y luego lo inscribe.

    Es el endpoint que usa el modal de inscripción del sitio. Responde
    **409** si esa persona ya estaba inscrita en ese evento o si no quedan
    cupos, y **422** si el evento no está publicado.
    """
    usuario = usuario_service.obtener_o_crear(
        db,
        UsuarioCrear(nombre=datos.nombre, email=datos.email, telefono=datos.telefono),
    )
    inscripcion = inscripcion_service.crear_inscripcion(db, datos.evento_id, usuario.id)
    notificar_cambio("inscripcion.creada", "inscripciones", inscripcion.id)
    return _a_detalle(db, inscripcion)


@router.get(
    "/inscripciones/{inscripcion_id}",
    response_model=InscripcionDetalle,
    summary="Obtener una inscripción",
)
def obtener_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    return _a_detalle(db, inscripcion_service.obtener_inscripcion(db, inscripcion_id))


@router.get(
    "/inscripciones/codigo/{codigo}",
    response_model=InscripcionDetalle,
    summary="Buscar inscripción por su código",
)
def obtener_por_codigo(codigo: str, db: Session = Depends(get_db)):
    """Consulta sin acreditar. Útil para verificar una entrada antes de usarla."""
    inscripcion = inscripcion_service.buscar_por_codigo(db, codigo)
    if inscripcion is None:
        from app.core.errores import NoEncontrado

        raise NoEncontrado(f"No existe una entrada con el código {codigo}.")
    return _a_detalle(db, inscripcion)


@router.post(
    "/inscripciones/{inscripcion_id}/cancelar",
    response_model=InscripcionSalida,
    summary="Cancelar una inscripción",
)
def cancelar_inscripcion(inscripcion_id: int, db: Session = Depends(get_db)):
    """Libera el cupo. Responde **422** si la persona ya fue acreditada."""
    resultado = inscripcion_service.cancelar_inscripcion(db, inscripcion_id)
    notificar_cambio("inscripcion.cancelada", "inscripciones", inscripcion_id)
    return resultado
