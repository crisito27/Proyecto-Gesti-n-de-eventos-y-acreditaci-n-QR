"""Modelos relacionales (PostgreSQL).

Modelo entidad-relación
-----------------------
    usuario 1 ──── 0..1 organizador
    organizador 1 ──── N evento
    categoria   1 ──── N evento
    evento      1 ──── N inscripcion
    usuario     1 ──── N inscripcion
    inscripcion 1 ──── 0..1 pago

Restricciones relevantes:
  · usuario.email es único.
  · inscripcion tiene UNIQUE (evento_id, usuario_id): la base de datos impide
    una doble inscripción aunque falle la validación de la capa de servicio.
  · inscripcion.codigo es único en todo el sistema.
  · pago.inscripcion_id es único: un pago por inscripción.
"""

from datetime import date, datetime
from decimal import Decimal
import enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# --------------------------------------------------------------------------
# Enumeraciones del dominio
# --------------------------------------------------------------------------

class RolUsuario(str, enum.Enum):
    ASISTENTE = "asistente"
    ORGANIZADOR = "organizador"


class EstadoEvento(str, enum.Enum):
    BORRADOR = "borrador"
    PUBLICADO = "publicado"
    CANCELADO = "cancelado"


class EstadoInscripcion(str, enum.Enum):
    PENDIENTE_PAGO = "pendiente_pago"
    CONFIRMADA = "confirmada"
    ACREDITADA = "acreditada"
    CANCELADA = "cancelada"


class EstadoPago(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    ANULADO = "anulado"


class MetodoPago(str, enum.Enum):
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"
    GRATUITO = "gratuito"


# --------------------------------------------------------------------------
# Entidades
# --------------------------------------------------------------------------

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False, unique=True, index=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, name="rol_usuario"), nullable=False, default=RolUsuario.ASISTENTE
    )
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organizador: Mapped["Organizador | None"] = relationship(back_populates="usuario", uselist=False)
    inscripciones: Mapped[list["Inscripcion"]] = relationship(back_populates="usuario")


class Organizador(Base):
    __tablename__ = "organizadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    nombre_organizacion: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    usuario: Mapped["Usuario"] = relationship(back_populates="organizador")
    eventos: Mapped[list["Evento"]] = relationship(back_populates="organizador")


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)

    eventos: Mapped[list["Evento"]] = relationship(back_populates="categoria")


class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organizador_id: Mapped[int] = mapped_column(ForeignKey("organizadores.id"), nullable=False)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)

    nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    lugar: Mapped[str] = mapped_column(String(180), nullable=False)
    latitud: Mapped[float | None] = mapped_column(Float)
    longitud: Mapped[float | None] = mapped_column(Float)
    exterior: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    aforo_max: Mapped[int] = mapped_column(Integer, nullable=False)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    estado: Mapped[EstadoEvento] = mapped_column(
        Enum(EstadoEvento, name="estado_evento"), nullable=False, default=EstadoEvento.BORRADOR
    )
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organizador: Mapped["Organizador"] = relationship(back_populates="eventos")
    categoria: Mapped["Categoria"] = relationship(back_populates="eventos")
    inscripciones: Mapped[list["Inscripcion"]] = relationship(
        back_populates="evento", cascade="all, delete-orphan"
    )


class Inscripcion(Base):
    __tablename__ = "inscripciones"
    __table_args__ = (
        # Garantía a nivel de base de datos contra la doble inscripción.
        UniqueConstraint("evento_id", "usuario_id", name="uq_inscripcion_evento_usuario"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("eventos.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    codigo: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    estado: Mapped[EstadoInscripcion] = mapped_column(
        Enum(EstadoInscripcion, name="estado_inscripcion"),
        nullable=False,
        default=EstadoInscripcion.PENDIENTE_PAGO,
    )
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    acreditada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    evento: Mapped["Evento"] = relationship(back_populates="inscripciones")
    usuario: Mapped["Usuario"] = relationship(back_populates="inscripciones")
    pago: Mapped["Pago | None"] = relationship(
        back_populates="inscripcion", uselist=False, cascade="all, delete-orphan"
    )


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inscripcion_id: Mapped[int] = mapped_column(
        ForeignKey("inscripciones.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    monto: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    metodo: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago, name="metodo_pago"), nullable=False)
    estado: Mapped[EstadoPago] = mapped_column(
        Enum(EstadoPago, name="estado_pago"), nullable=False, default=EstadoPago.PENDIENTE
    )
    numero_comprobante: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    pagado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    inscripcion: Mapped["Inscripcion"] = relationship(back_populates="pago")
