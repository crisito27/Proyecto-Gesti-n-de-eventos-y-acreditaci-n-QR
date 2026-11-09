"""Endpoints de usuarios y organizadores."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.usuario import (
    OrganizadorCrear,
    OrganizadorSalida,
    UsuarioCrear,
    UsuarioSalida,
)
from app.services import evento_service, usuario_service

router = APIRouter(tags=["Usuarios y organizadores"])


@router.get("/usuarios", response_model=list[UsuarioSalida], summary="Listar usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return usuario_service.listar_usuarios(db)


@router.post(
    "/usuarios",
    response_model=UsuarioSalida,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un usuario",
)
def crear_usuario(datos: UsuarioCrear, db: Session = Depends(get_db)):
    """Registra un asistente u organizador.

    Responde **409** si el correo ya está registrado.
    """
    return usuario_service.crear_usuario(db, datos)


@router.get("/usuarios/{usuario_id}", response_model=UsuarioSalida, summary="Obtener un usuario")
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return usuario_service.obtener_usuario(db, usuario_id)


@router.get(
    "/organizadores", response_model=list[OrganizadorSalida], summary="Listar organizadores"
)
def listar_organizadores(db: Session = Depends(get_db)):
    return evento_service.listar_organizadores(db)


@router.post(
    "/organizadores",
    response_model=OrganizadorSalida,
    status_code=status.HTTP_201_CREATED,
    summary="Crear perfil de organizador",
)
def crear_organizador(datos: OrganizadorCrear, db: Session = Depends(get_db)):
    """Convierte a un usuario existente en organizador.

    Responde **404** si el usuario no existe y **409** si ya tiene perfil.
    """
    return evento_service.crear_organizador(
        db, datos.usuario_id, datos.nombre_organizacion, datos.descripcion
    )
