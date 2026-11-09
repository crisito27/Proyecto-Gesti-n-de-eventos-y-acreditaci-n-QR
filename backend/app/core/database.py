"""Conexión a PostgreSQL mediante SQLAlchemy.

`get_db` es la dependencia que FastAPI inyecta en cada endpoint: abre una
sesión, la entrega, y la cierra siempre al terminar, incluso si hubo error.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # descarta conexiones muertas antes de usarlas
    echo=settings.debug,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Clase base de la que heredan todos los modelos relacionales."""


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
