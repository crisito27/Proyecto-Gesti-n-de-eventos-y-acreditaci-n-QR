"""Reglas de negocio de inscripciones.

Aquí viven dos de las reglas que el Hito 3 pide demostrar:
  · no inscribirse dos veces en el mismo evento;
  · no superar el aforo del evento.
"""

import secrets
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errores import Conflicto, NoEncontrado, ReglaNegocio
from app.models import EstadoEvento, EstadoInscripcion, Inscripcion
from app.services import evento_service, usuario_service


def generar_codigo() -> str:
    """Código de acreditación único e impredecible.

    `secrets.token_hex` usa un generador criptográficamente seguro: un código
    adivinable permitiría entrar a un evento sin estar inscrito.
    """
    return f"EVQR-{secrets.token_hex(4).upper()}-{secrets.token_hex(3).upper()}"


def listar_inscripciones(
    db: Session,
    evento_id: int | None = None,
    usuario_id: int | None = None,
) -> list[Inscripcion]:
    consulta = select(Inscripcion).order_by(Inscripcion.creada_en.desc())
    if evento_id is not None:
        consulta = consulta.where(Inscripcion.evento_id == evento_id)
    if usuario_id is not None:
        consulta = consulta.where(Inscripcion.usuario_id == usuario_id)
    return list(db.scalars(consulta))


def obtener_inscripcion(db: Session, inscripcion_id: int) -> Inscripcion:
    inscripcion = db.get(Inscripcion, inscripcion_id)
    if inscripcion is None:
        raise NoEncontrado(f"No existe la inscripción {inscripcion_id}.")
    return inscripcion


def buscar_por_codigo(db: Session, codigo: str) -> Inscripcion | None:
    return db.scalar(select(Inscripcion).where(Inscripcion.codigo == codigo.strip().upper()))


def crear_inscripcion(db: Session, evento_id: int, usuario_id: int) -> Inscripcion:
    evento = evento_service.obtener_evento(db, evento_id)
    usuario_service.obtener_usuario(db, usuario_id)

    # Regla 1: sólo se puede uno inscribir en eventos publicados.
    if evento.estado == EstadoEvento.BORRADOR:
        raise ReglaNegocio(
            "El evento aún no está publicado.", codigo="evento_no_publicado"
        )
    if evento.estado == EstadoEvento.CANCELADO:
        raise ReglaNegocio("El evento fue cancelado.", codigo="evento_cancelado")

    # Regla 2: una persona no puede inscribirse dos veces en el mismo evento.
    existente = db.scalar(
        select(Inscripcion).where(
            Inscripcion.evento_id == evento_id,
            Inscripcion.usuario_id == usuario_id,
            Inscripcion.estado != EstadoInscripcion.CANCELADA,
        )
    )
    if existente:
        raise Conflicto(
            "Esta persona ya está inscrita en el evento.",
            codigo="inscripcion_duplicada",
        )

    # Regla 3: no superar el aforo.
    inscritos = evento_service.contar_inscritos(db, evento_id)
    if inscritos >= evento.aforo_max:
        raise Conflicto(
            f"El evento alcanzó su aforo máximo de {evento.aforo_max} personas.",
            codigo="aforo_completo",
        )

    # Un evento gratuito queda confirmado de inmediato; uno con precio queda
    # pendiente hasta que se registre el pago.
    estado_inicial = (
        EstadoInscripcion.CONFIRMADA
        if evento.precio == 0
        else EstadoInscripcion.PENDIENTE_PAGO
    )

    inscripcion = Inscripcion(
        evento_id=evento_id,
        usuario_id=usuario_id,
        codigo=generar_codigo(),
        estado=estado_inicial,
    )
    db.add(inscripcion)

    try:
        db.commit()
    except IntegrityError:
        # Red de seguridad: si dos peticiones simultáneas pasaron la
        # validación anterior, la restricción UNIQUE de la tabla rechaza la
        # segunda. Es la misma regla aplicada por la base de datos.
        db.rollback()
        raise Conflicto(
            "Esta persona ya está inscrita en el evento.",
            codigo="inscripcion_duplicada",
        ) from None

    db.refresh(inscripcion)
    return inscripcion


def cancelar_inscripcion(db: Session, inscripcion_id: int) -> Inscripcion:
    inscripcion = obtener_inscripcion(db, inscripcion_id)

    if inscripcion.estado == EstadoInscripcion.CANCELADA:
        raise Conflicto("La inscripción ya estaba cancelada.", codigo="inscripcion_cancelada")
    if inscripcion.estado == EstadoInscripcion.ACREDITADA:
        raise ReglaNegocio(
            "No se puede cancelar una inscripción ya acreditada en el evento.",
            codigo="inscripcion_acreditada",
        )

    inscripcion.estado = EstadoInscripcion.CANCELADA
    db.commit()
    db.refresh(inscripcion)
    return inscripcion


def marcar_acreditada(db: Session, inscripcion: Inscripcion) -> Inscripcion:
    inscripcion.estado = EstadoInscripcion.ACREDITADA
    inscripcion.acreditada_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inscripcion)
    return inscripcion
