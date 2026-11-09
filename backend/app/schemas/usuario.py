"""DTO de usuarios y organizadores.

Los esquemas de entrada validan lo que llega desde el cliente; los de salida
definen qué se devuelve. Separarlos evita exponer campos internos y permite
validar sin tocar los modelos de base de datos.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import RolUsuario


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    email: EmailStr
    telefono: str | None = Field(default=None, pattern=r"^\d{8,12}$")
    rol: RolUsuario = RolUsuario.ASISTENTE


class UsuarioSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: EmailStr
    telefono: str | None
    rol: RolUsuario
    creado_en: datetime


class OrganizadorCrear(BaseModel):
    usuario_id: int
    nombre_organizacion: str = Field(min_length=3, max_length=160)
    descripcion: str | None = None


class OrganizadorSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    nombre_organizacion: str
    descripcion: str | None
    creado_en: datetime


class OrganizadorDetalle(OrganizadorSalida):
    usuario: UsuarioSalida
