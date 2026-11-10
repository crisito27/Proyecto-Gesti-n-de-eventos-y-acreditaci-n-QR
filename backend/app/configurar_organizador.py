"""Configura claves privadas para organizadores ya existentes en la base."""
import os
from sqlalchemy import func, select

from app.core.auth import hash_clave
from app.core.database import Base, SessionLocal, engine
from app.models import Credencial, RolUsuario, Usuario


def main():
    email = os.getenv("ORGANIZADOR_EMAIL", "").strip().lower()
    clave = os.getenv("ORGANIZADOR_PASSWORD", "")
    if not email or len(clave) < 12:
        raise SystemExit("Se requieren ORGANIZADOR_EMAIL y ORGANIZADOR_PASSWORD (12 caracteres como mínimo).")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        usuario = db.scalar(select(Usuario).where(func.lower(Usuario.email) == email))
        if usuario is None or usuario.rol != RolUsuario.ORGANIZADOR or usuario.organizador is None:
            raise SystemExit("El correo no corresponde a un organizador existente del seed.")
        credencial = db.get(Credencial, usuario.id)
        if credencial:
            credencial.clave_hash = hash_clave(clave)
        else:
            db.add(Credencial(usuario_id=usuario.id, clave_hash=hash_clave(clave)))
        db.commit()
    print(f"Credencial configurada para {email}")


if __name__ == "__main__":
    main()
