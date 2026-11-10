"""Autenticación con contraseñas PBKDF2 y tokens HMAC temporales."""
import base64
import hashlib
import hmac
import json
import secrets
import time

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.errores import SinAutenticacion, SinPermiso
from app.models import RolUsuario, Usuario

_SECRETO = settings.auth_secret.encode() if len(settings.auth_secret) >= 32 else secrets.token_bytes(32)
ESQUEMA = HTTPBearer(auto_error=False)


def hash_clave(clave: str) -> str:
    if len(clave) < 12:
        raise ValueError("La contraseña debe tener al menos 12 caracteres.")
    sal = secrets.token_bytes(16)
    rondas = 310_000
    huella = hashlib.pbkdf2_hmac("sha256", clave.encode(), sal, rondas)
    return f"pbkdf2_sha256${rondas}${sal.hex()}${huella.hex()}"


def validar_clave(clave: str, almacenada: str) -> bool:
    try:
        algoritmo, rondas, sal, huella = almacenada.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        esperada = hashlib.pbkdf2_hmac("sha256", clave.encode(), bytes.fromhex(sal), int(rondas))
        return hmac.compare_digest(esperada, bytes.fromhex(huella))
    except (ValueError, TypeError):
        return False


def _b64(datos: bytes) -> str:
    return base64.urlsafe_b64encode(datos).rstrip(b"=").decode("ascii")


def _desb64(cadena: str) -> bytes:
    return base64.urlsafe_b64decode(cadena + "=" * (-len(cadena) % 4))


def emitir_token(usuario_id: int) -> str:
    payload = {"sub": usuario_id, "exp": int(time.time()) + 3600 * max(1, settings.auth_duracion_horas)}
    parte = _b64(json.dumps(payload, separators=(",", ":")).encode())
    firma = _b64(hmac.new(_SECRETO, parte.encode(), hashlib.sha256).digest())
    return parte + "." + firma


def verificar_token(token: str) -> int:
    try:
        parte, firma = token.split(".")
        esperado = hmac.new(_SECRETO, parte.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(esperado, _desb64(firma)):
            raise ValueError("Firma inválida")
        payload = json.loads(_desb64(parte))
        if int(payload["exp"]) < int(time.time()) or not isinstance(payload["sub"], int):
            raise ValueError("Token vencido o inválido")
        return payload["sub"]
    except (KeyError, ValueError, UnicodeDecodeError, TypeError):
        raise SinAutenticacion("Sesión inválida o expirada. Inicia sesión otra vez.") from None


def requerir_usuario(
    credenciales: HTTPAuthorizationCredentials | None = Depends(ESQUEMA),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciales is None or credenciales.scheme.lower() != "bearer":
        raise SinAutenticacion("Debes iniciar sesión para realizar esta operación.")
    usuario = db.get(Usuario, verificar_token(credenciales.credentials))
    if usuario is None:
        raise SinAutenticacion("La cuenta ya no existe.")
    return usuario


def requerir_organizador(usuario: Usuario = Depends(requerir_usuario)) -> Usuario:
    if usuario.rol != RolUsuario.ORGANIZADOR or usuario.organizador is None:
        raise SinPermiso("Solo un organizador autenticado puede realizar esta operación.")
    return usuario


def comprobar_entrada(codigo_esperado: str, codigo_recibido: str | None) -> None:
    if not codigo_recibido or not hmac.compare_digest(
        codigo_esperado.strip().upper(), codigo_recibido.strip().upper()
    ):
        raise SinPermiso("Se requiere el código original de esta entrada.")
