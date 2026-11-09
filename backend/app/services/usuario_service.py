"""Reglas de negocio de usuarios."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errores import Conflicto, NoEncontrado
from app.models import Usuario
from app.schemas.usuario import UsuarioCrear


def listar_usuarios(db: Session) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.nombre)))


def obtener_usuario(db: Session, usuario_id: int) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise NoEncontrado(f"No existe el usuario {usuario_id}.")
    return usuario


def buscar_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(func.lower(Usuario.email) == email.lower()))


def crear_usuario(db: Session, datos: UsuarioCrear) -> Usuario:
    if buscar_por_email(db, datos.email):
        raise Conflicto(
            f"Ya hay un usuario registrado con el correo {datos.email}.",
            codigo="email_duplicado",
        )

    usuario = Usuario(**datos.model_dump())
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def obtener_o_crear(db: Session, datos: UsuarioCrear) -> Usuario:
    """Usado por el flujo de inscripción desde el frontend.

    El asistente se identifica por su correo. Si ya se inscribió antes en otro
    evento, se reutiliza su registro en lugar de duplicarlo.
    """
    existente = buscar_por_email(db, datos.email)
    if existente:
        return existente
    return crear_usuario(db, datos)
