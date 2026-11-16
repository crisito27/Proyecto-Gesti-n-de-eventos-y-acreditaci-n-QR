"""Rutas de inicio de sesión de organizadores (sin altas públicas privilegiadas)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import emitir_token, requerir_usuario, validar_clave
from app.core.database import get_db
from app.core.errores import SinAutenticacion
from app.models import Credencial, Usuario
from app.schemas.usuario import UsuarioSalida

router = APIRouter(tags=["Autenticación"])


class InicioSesion(BaseModel):
    email: EmailStr
    clave: str = Field(min_length=1, max_length=256)


class SesionSalida(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSalida


@router.post("/auth/login", response_model=SesionSalida, summary="Iniciar sesión")
def iniciar_sesion(datos: InicioSesion, db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(func.lower(Usuario.email) == datos.email.lower()))
    credencial = db.get(Credencial, usuario.id) if usuario else None
    if credencial is None or not validar_clave(datos.clave, credencial.clave_hash):
        raise SinAutenticacion("Correo o contraseña incorrectos.")
    return SesionSalida(access_token=emitir_token(usuario.id), usuario=usuario)


@router.get("/auth/yo", response_model=UsuarioSalida, summary="Consultar sesión")
def ver_sesion(usuario: Usuario = Depends(requerir_usuario)):
    return usuario
