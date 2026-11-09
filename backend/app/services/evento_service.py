"""Reglas de negocio de categorías, organizadores y eventos."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errores import Conflicto, NoEncontrado, ReglaNegocio
from app.models import (
    Categoria,
    EstadoEvento,
    EstadoInscripcion,
    Evento,
    Inscripcion,
    Organizador,
    RolUsuario,
    Usuario,
)
from app.schemas.evento import EventoActualizar, EventoCrear, EventoSalida

# Estados que ocupan un cupo. Una inscripción cancelada libera su lugar.
ESTADOS_QUE_OCUPAN_CUPO = (
    EstadoInscripcion.PENDIENTE_PAGO,
    EstadoInscripcion.CONFIRMADA,
    EstadoInscripcion.ACREDITADA,
)


# --------------------------------------------------------------------------
# Categorías
# --------------------------------------------------------------------------

def listar_categorias(db: Session) -> list[Categoria]:
    return list(db.scalars(select(Categoria).order_by(Categoria.nombre)))


def crear_categoria(db: Session, nombre: str) -> Categoria:
    existente = db.scalar(select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower()))
    if existente:
        raise Conflicto(f"Ya existe la categoría '{nombre}'.", codigo="categoria_duplicada")
    categoria = Categoria(nombre=nombre)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


# --------------------------------------------------------------------------
# Organizadores
# --------------------------------------------------------------------------

def listar_organizadores(db: Session) -> list[Organizador]:
    return list(db.scalars(select(Organizador).order_by(Organizador.nombre_organizacion)))


def obtener_organizador(db: Session, organizador_id: int) -> Organizador:
    organizador = db.get(Organizador, organizador_id)
    if organizador is None:
        raise NoEncontrado(f"No existe el organizador {organizador_id}.")
    return organizador


def crear_organizador(db: Session, usuario_id: int, nombre_organizacion: str,
                      descripcion: str | None) -> Organizador:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise NoEncontrado(f"No existe el usuario {usuario_id}.")

    if usuario.organizador is not None:
        raise Conflicto(
            "Este usuario ya tiene un perfil de organizador.", codigo="organizador_duplicado"
        )

    organizador = Organizador(
        usuario_id=usuario_id,
        nombre_organizacion=nombre_organizacion,
        descripcion=descripcion,
    )
    # Al crear el perfil, el usuario pasa a tener rol de organizador.
    usuario.rol = RolUsuario.ORGANIZADOR
    db.add(organizador)
    db.commit()
    db.refresh(organizador)
    return organizador


# --------------------------------------------------------------------------
# Eventos
# --------------------------------------------------------------------------

def contar_inscritos(db: Session, evento_id: int) -> int:
    """Número de inscripciones que ocupan cupo en un evento.

    Es un dato derivado: se calcula contando filas, no se guarda en una
    columna. Así nunca puede quedar desincronizado de las inscripciones
    reales.
    """
    return db.scalar(
        select(func.count(Inscripcion.id)).where(
            Inscripcion.evento_id == evento_id,
            Inscripcion.estado.in_(ESTADOS_QUE_OCUPAN_CUPO),
        )
    ) or 0


def a_salida(db: Session, evento: Evento) -> EventoSalida:
    """Convierte el modelo en su DTO, agregando los datos derivados.

    Se copian sólo las columnas de la tabla, no las relaciones: los campos
    `categoria` y `organizador` del DTO son texto, y si se dejara que
    Pydantic leyera los atributos del modelo recibiría los objetos
    relacionados en su lugar.
    """
    inscritos = contar_inscritos(db, evento.id)
    disponibles = max(evento.aforo_max - inscritos, 0)

    datos = {columna.name: getattr(evento, columna.name) for columna in evento.__table__.columns}
    datos["categoria"] = evento.categoria.nombre if evento.categoria else None
    datos["organizador"] = (
        evento.organizador.nombre_organizacion if evento.organizador else None
    )
    datos["inscritos"] = inscritos
    datos["cupos_disponibles"] = disponibles
    datos["agotado"] = disponibles == 0

    return EventoSalida.model_validate(datos)


def listar_eventos(
    db: Session,
    texto: str | None = None,
    categoria_id: int | None = None,
    estado: EstadoEvento | None = None,
    organizador_id: int | None = None,
) -> list[Evento]:
    consulta = select(Evento).order_by(Evento.fecha)

    if texto:
        patron = f"%{texto.lower()}%"
        consulta = consulta.where(
            func.lower(Evento.nombre).like(patron) | func.lower(Evento.lugar).like(patron)
        )
    if categoria_id is not None:
        consulta = consulta.where(Evento.categoria_id == categoria_id)
    if estado is not None:
        consulta = consulta.where(Evento.estado == estado)
    if organizador_id is not None:
        consulta = consulta.where(Evento.organizador_id == organizador_id)

    return list(db.scalars(consulta))


def obtener_evento(db: Session, evento_id: int) -> Evento:
    evento = db.get(Evento, evento_id)
    if evento is None:
        raise NoEncontrado(f"No existe el evento {evento_id}.")
    return evento


def bloquear_evento(db: Session, evento_id: int) -> Evento:
    """Bloquea la fila hasta commit/rollback para serializar cambios de aforo.

    Evita que dos inscripciones concurrentes lean el mismo último cupo o
    que una edición reduzca el aforo al mismo tiempo que alguien se inscribe.
    Requiere PostgreSQL (SELECT FOR UPDATE).
    """
    evento = db.scalar(
        select(Evento)
        .where(Evento.id == evento_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if evento is None:
        raise NoEncontrado(f"No existe el evento {evento_id}.")
    return evento


def crear_evento(db: Session, datos: EventoCrear) -> Evento:
    obtener_organizador(db, datos.organizador_id)
    if db.get(Categoria, datos.categoria_id) is None:
        raise NoEncontrado(f"No existe la categoría {datos.categoria_id}.")

    evento = Evento(**datos.model_dump())
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


def actualizar_evento(db: Session, evento_id: int, datos: EventoActualizar) -> Evento:
    evento = bloquear_evento(db, evento_id)

    if evento.estado == EstadoEvento.CANCELADO:
        raise ReglaNegocio("No se puede editar un evento cancelado.", codigo="evento_cancelado")

    cambios = datos.model_dump(exclude_unset=True)

    if "categoria_id" in cambios and db.get(Categoria, cambios["categoria_id"]) is None:
        raise NoEncontrado(f"No existe la categoría {cambios['categoria_id']}.")

    # No se puede reducir el aforo por debajo de las personas ya inscritas.
    if "aforo_max" in cambios:
        inscritos = contar_inscritos(db, evento_id)
        if cambios["aforo_max"] < inscritos:
            raise Conflicto(
                f"El evento ya tiene {inscritos} inscritos: el aforo no puede quedar por debajo.",
                codigo="aforo_menor_que_inscritos",
            )

    for campo, valor in cambios.items():
        setattr(evento, campo, valor)

    db.commit()
    db.refresh(evento)
    return evento


def publicar_evento(db: Session, evento_id: int) -> Evento:
    """Publicar es lo que habilita las inscripciones.

    Un evento en borrador no acepta inscritos, por eso se exige que tenga los
    datos mínimos antes de publicarse.
    """
    evento = bloquear_evento(db, evento_id)

    if evento.estado == EstadoEvento.PUBLICADO:
        raise Conflicto("El evento ya está publicado.", codigo="evento_ya_publicado")
    if evento.estado == EstadoEvento.CANCELADO:
        raise ReglaNegocio("Un evento cancelado no puede publicarse.", codigo="evento_cancelado")
    if not evento.descripcion.strip():
        raise ReglaNegocio(
            "El evento necesita una descripción antes de publicarse.",
            codigo="descripcion_requerida",
        )

    evento.estado = EstadoEvento.PUBLICADO
    db.commit()
    db.refresh(evento)
    return evento


def cancelar_evento(db: Session, evento_id: int) -> Evento:
    evento = bloquear_evento(db, evento_id)
    if evento.estado == EstadoEvento.CANCELADO:
        raise Conflicto("El evento ya está cancelado.", codigo="evento_ya_cancelado")

    evento.estado = EstadoEvento.CANCELADO
    # Cancelar el evento cancela las inscripciones que seguían vigentes.
    for inscripcion in evento.inscripciones:
        if inscripcion.estado in ESTADOS_QUE_OCUPAN_CUPO:
            inscripcion.estado = EstadoInscripcion.CANCELADA

    db.commit()
    db.refresh(evento)
    return evento


def eliminar_evento(db: Session, evento_id: int) -> None:
    evento = bloquear_evento(db, evento_id)
    inscritos = contar_inscritos(db, evento_id)
    if inscritos > 0:
        raise Conflicto(
            f"No se puede eliminar: el evento tiene {inscritos} inscritos. Cancélalo en su lugar.",
            codigo="evento_con_inscritos",
        )
    db.delete(evento)
    db.commit()
