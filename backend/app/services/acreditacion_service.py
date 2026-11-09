"""Acreditación en la puerta del evento.

Este servicio es el que usa las dos bases de datos a la vez, y es el ejemplo
más claro de por qué conviven:

  · PostgreSQL guarda el ESTADO: la inscripción pasa a "acreditada".
  · MongoDB guarda el HECHO: quedó registrado que a tal hora, en tal puerta,
    se presentó tal código y el sistema respondió tal cosa.

Todo intento se escribe en Mongo, incluso los rechazados. Un código inválido
no cambia nada en PostgreSQL, pero sí es información valiosa para el
organizador: permite detectar entradas falsas, reventa o problemas de lectura
del QR en la puerta.
"""

from datetime import datetime, timezone
from typing import Any

from pymongo.collection import Collection
from sqlalchemy.orm import Session

from app.core.errores import NoEncontrado
from app.models import EstadoEvento, EstadoInscripcion, EstadoPago, Inscripcion
from app.schemas.acreditacion import (
    AcreditacionSalida,
    RegistroAccesoSalida,
    ResultadoAcceso,
    ResumenParticipacion,
)
from app.services import inscripcion_service


# --------------------------------------------------------------------------
# Escritura en MongoDB
# --------------------------------------------------------------------------

def registrar_acceso(
    registros: Collection,
    codigo: str,
    resultado: ResultadoAcceso,
    puerta: str,
    evento_id: int | None = None,
    inscripcion_id: int | None = None,
    detalle: dict[str, Any] | None = None,
) -> None:
    """Inserta un documento en la colección `registros_acceso`.

    El campo `detalle` es distinto según el resultado, y ésa es justamente la
    razón de usar un modelo documental: no hay que crear columnas nulas para
    los casos que no aplican.
    """
    registros.insert_one(
        {
            "codigo": codigo,
            "resultado": resultado,
            "puerta": puerta,
            "evento_id": evento_id,
            "inscripcion_id": inscripcion_id,
            "ocurrido_en": datetime.now(timezone.utc),
            "detalle": detalle or {},
        }
    )


# --------------------------------------------------------------------------
# Caso de uso principal
# --------------------------------------------------------------------------

def acreditar(
    db: Session, registros: Collection, codigo: str, puerta: str
) -> AcreditacionSalida:
    codigo = codigo.strip().upper()
    inscripcion: Inscripcion | None = inscripcion_service.buscar_por_codigo(db, codigo)

    # Caso 1: el código no corresponde a ninguna entrada emitida.
    if inscripcion is None:
        registrar_acceso(registros, codigo, "codigo_invalido", puerta)
        return AcreditacionSalida(
            resultado="codigo_invalido",
            mensaje="No existe ninguna entrada con ese código.",
            codigo=codigo,
        )

    evento = inscripcion.evento
    usuario = inscripcion.usuario
    base = {
        "evento_id": evento.id,
        "inscripcion_id": inscripcion.id,
        "puerta": puerta,
    }

    # Caso 2: la entrada ya fue utilizada.
    if inscripcion.estado == EstadoInscripcion.ACREDITADA:
        registrar_acceso(
            registros, codigo, "duplicado", **base,
            detalle={
                "asistente": usuario.nombre,
                "acreditada_originalmente_en": inscripcion.acreditada_en.isoformat()
                if inscripcion.acreditada_en
                else None,
            },
        )
        return AcreditacionSalida(
            resultado="duplicado",
            mensaje=f"{usuario.nombre} ya registró su asistencia a este evento.",
            codigo=codigo,
            inscripcion_id=inscripcion.id,
            asistente=usuario.nombre,
            evento=evento.nombre,
            acreditada_en=inscripcion.acreditada_en,
        )

    # Caso 3: la inscripción fue cancelada.
    if inscripcion.estado == EstadoInscripcion.CANCELADA:
        registrar_acceso(
            registros, codigo, "cancelada", **base, detalle={"asistente": usuario.nombre}
        )
        return AcreditacionSalida(
            resultado="cancelada",
            mensaje="Esta inscripción fue cancelada y no permite el acceso.",
            codigo=codigo,
            inscripcion_id=inscripcion.id,
            asistente=usuario.nombre,
            evento=evento.nombre,
        )

    # Caso 4: el evento no está publicado.
    if evento.estado != EstadoEvento.PUBLICADO:
        registrar_acceso(
            registros, codigo, "evento_no_publicado", **base,
            detalle={"estado_evento": evento.estado.value},
        )
        return AcreditacionSalida(
            resultado="evento_no_publicado",
            mensaje=f"El evento está en estado '{evento.estado.value}'.",
            codigo=codigo,
            inscripcion_id=inscripcion.id,
            asistente=usuario.nombre,
            evento=evento.nombre,
        )

    # Caso 5: evento con precio y sin pago confirmado.
    pago_ok = inscripcion.pago is not None and inscripcion.pago.estado == EstadoPago.PAGADO
    if evento.precio > 0 and not pago_ok:
        registrar_acceso(
            registros, codigo, "sin_pago", **base,
            detalle={"asistente": usuario.nombre, "monto_pendiente": float(evento.precio)},
        )
        return AcreditacionSalida(
            resultado="sin_pago",
            mensaje="La inscripción no tiene un pago confirmado.",
            codigo=codigo,
            inscripcion_id=inscripcion.id,
            asistente=usuario.nombre,
            evento=evento.nombre,
        )

    # Caso 6: todo en orden. Se actualiza PostgreSQL y se deja el registro.
    inscripcion_service.marcar_acreditada(db, inscripcion)
    registrar_acceso(
        registros, codigo, "acreditado", **base,
        detalle={"asistente": usuario.nombre, "email": usuario.email},
    )
    return AcreditacionSalida(
        resultado="acreditado",
        mensaje=f"Asistencia de {usuario.nombre} registrada correctamente.",
        codigo=codigo,
        inscripcion_id=inscripcion.id,
        asistente=usuario.nombre,
        evento=evento.nombre,
        acreditada_en=inscripcion.acreditada_en,
    )


# --------------------------------------------------------------------------
# Lectura desde MongoDB
# --------------------------------------------------------------------------

def listar_registros(
    registros: Collection, evento_id: int | None = None, limite: int = 100
) -> list[RegistroAccesoSalida]:
    filtro: dict[str, Any] = {}
    if evento_id is not None:
        filtro["evento_id"] = evento_id

    documentos = registros.find(filtro).sort("ocurrido_en", -1).limit(limite)
    return [
        RegistroAccesoSalida(
            id=str(doc["_id"]),
            evento_id=doc.get("evento_id"),
            inscripcion_id=doc.get("inscripcion_id"),
            codigo=doc["codigo"],
            resultado=doc["resultado"],
            puerta=doc.get("puerta", "principal"),
            ocurrido_en=doc["ocurrido_en"],
            detalle=doc.get("detalle", {}),
        )
        for doc in documentos
    ]


def resumen_participacion(registros: Collection, evento_id: int) -> ResumenParticipacion:
    """Agregación en MongoDB: cuenta los intentos por resultado.

    Usa el pipeline de agregación de Mongo en lugar de traer todos los
    documentos y contarlos en Python, que no escalaría.
    """
    pipeline = [
        {"$match": {"evento_id": evento_id}},
        {
            "$group": {
                "_id": "$resultado",
                "total": {"$sum": 1},
                "primero": {"$min": "$ocurrido_en"},
                "ultimo": {"$max": "$ocurrido_en"},
            }
        },
    ]
    filas = list(registros.aggregate(pipeline))

    conteos = {fila["_id"]: fila["total"] for fila in filas}
    momentos = [fila["primero"] for fila in filas] + [fila["ultimo"] for fila in filas]

    conocidos = {"acreditado", "duplicado", "codigo_invalido"}
    otros = sum(total for resultado, total in conteos.items() if resultado not in conocidos)

    return ResumenParticipacion(
        evento_id=evento_id,
        total_intentos=sum(conteos.values()),
        acreditados=conteos.get("acreditado", 0),
        duplicados=conteos.get("duplicado", 0),
        codigos_invalidos=conteos.get("codigo_invalido", 0),
        otros_rechazos=otros,
        primer_acceso=min(momentos) if momentos else None,
        ultimo_acceso=max(momentos) if momentos else None,
    )
