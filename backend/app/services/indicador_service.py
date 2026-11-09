"""Indicadores del panel del organizador.

Todos los números se calculan con consultas agregadas en PostgreSQL. No hay
contadores guardados en columnas, de modo que los indicadores no pueden
quedar desfasados respecto de los datos reales.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    EstadoEvento,
    EstadoInscripcion,
    EstadoPago,
    Evento,
    Inscripcion,
    Pago,
)
from app.schemas.comunes import IndicadorEvento, IndicadoresSalida

ESTADOS_ACTIVOS = (
    EstadoInscripcion.PENDIENTE_PAGO,
    EstadoInscripcion.CONFIRMADA,
    EstadoInscripcion.ACREDITADA,
)


def calcular(db: Session) -> IndicadoresSalida:
    eventos = list(db.scalars(select(Evento).order_by(Evento.fecha)))

    por_evento: list[IndicadorEvento] = []
    total_inscripciones = 0
    total_acreditados = 0
    recaudacion_total = 0.0

    for evento in eventos:
        inscritos = db.scalar(
            select(func.count(Inscripcion.id)).where(
                Inscripcion.evento_id == evento.id,
                Inscripcion.estado.in_(ESTADOS_ACTIVOS),
            )
        ) or 0

        confirmados = db.scalar(
            select(func.count(Inscripcion.id)).where(
                Inscripcion.evento_id == evento.id,
                Inscripcion.estado == EstadoInscripcion.CONFIRMADA,
            )
        ) or 0

        acreditados = db.scalar(
            select(func.count(Inscripcion.id)).where(
                Inscripcion.evento_id == evento.id,
                Inscripcion.estado == EstadoInscripcion.ACREDITADA,
            )
        ) or 0

        recaudado = db.scalar(
            select(func.coalesce(func.sum(Pago.monto), 0))
            .join(Inscripcion, Pago.inscripcion_id == Inscripcion.id)
            .where(Inscripcion.evento_id == evento.id, Pago.estado == EstadoPago.PAGADO)
        ) or 0

        ocupacion = (inscritos / evento.aforo_max * 100) if evento.aforo_max else 0.0

        por_evento.append(
            IndicadorEvento(
                evento_id=evento.id,
                nombre=evento.nombre,
                fecha=evento.fecha,
                aforo_max=evento.aforo_max,
                inscritos=inscritos,
                confirmados=confirmados,
                acreditados=acreditados,
                cupos_disponibles=max(evento.aforo_max - inscritos, 0),
                ocupacion_pct=round(ocupacion, 1),
                recaudado=float(recaudado),
            )
        )

        total_inscripciones += inscritos
        total_acreditados += acreditados
        recaudacion_total += float(recaudado)

    publicados = sum(1 for e in eventos if e.estado == EstadoEvento.PUBLICADO)

    return IndicadoresSalida(
        total_eventos=len(eventos),
        eventos_publicados=publicados,
        total_inscripciones=total_inscripciones,
        total_acreditados=total_acreditados,
        recaudacion_total=round(recaudacion_total, 2),
        por_evento=por_evento,
    )
