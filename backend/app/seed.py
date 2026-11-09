"""Datos de prueba reproducibles.

Se ejecuta con:   python -m app.seed

Es idempotente: si los datos ya están cargados, no los duplica. Eso permite
correrlo las veces que haga falta sin ensuciar la base.

Las fechas de los eventos se calculan a partir del día en que se ejecuta,
para que siempre queden dentro del rango de pronóstico de Open-Meteo (unos
16 días) y la demostración muestre datos de clima reales.
"""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.models import (
    Categoria,
    EstadoEvento,
    Evento,
    Organizador,
    RolUsuario,
    Usuario,
)

CATEGORIAS = ["Seminario", "Capacitación", "Feria", "Taller"]

ORGANIZADORES = [
    {
        "nombre": "Escuela de Ingeniería",
        "email": "ingenieria@uandresbello.edu",
        "organizacion": "Escuela de Ingeniería UNAB",
        "descripcion": "Organiza seminarios y actividades académicas de la escuela.",
    },
    {
        "nombre": "Centro de Estudiantes Informática",
        "email": "cee.informatica@uandresbello.edu",
        "organizacion": "Centro de Estudiantes de Informática",
        "descripcion": "Capacitaciones y actividades estudiantiles.",
    },
    {
        "nombre": "Dirección de Deportes",
        "email": "deportes@uandresbello.edu",
        "organizacion": "Dirección de Deportes UNAB",
        "descripcion": "Actividades deportivas y recreativas del campus.",
    },
]

ASISTENTES = [
    {"nombre": "Camila Fuentes", "email": "camila.fuentes@ejemplo.cl", "telefono": "912345678"},
    {"nombre": "Diego Soto", "email": "diego.soto@ejemplo.cl", "telefono": "923456789"},
    {"nombre": "Valentina Rivas", "email": "valentina.rivas@ejemplo.cl", "telefono": "934567890"},
]


def _eventos(hoy: date) -> list[dict]:
    return [
        {
            "nombre": "Seminario de Inteligencia Artificial Aplicada",
            "descripcion": "Charlas y paneles sobre el uso práctico de IA en la industria chilena.",
            "categoria": "Seminario",
            "organizacion": "Escuela de Ingeniería UNAB",
            "fecha": hoy + timedelta(days=4),
            "lugar": "Auditorio Central, UNAB Viña del Mar",
            "latitud": -33.0245,
            "longitud": -71.5518,
            "exterior": False,
            "aforo_max": 60,
            "precio": Decimal("0"),
            "estado": EstadoEvento.PUBLICADO,
        },
        {
            "nombre": "Capacitación en Git y control de versiones",
            "descripcion": "Taller práctico de Git, GitHub y Git Flow para equipos de desarrollo.",
            "categoria": "Capacitación",
            "organizacion": "Centro de Estudiantes de Informática",
            "fecha": hoy + timedelta(days=6),
            "lugar": "Laboratorio 3, Edificio B",
            "latitud": -33.0251,
            "longitud": -71.5503,
            "exterior": False,
            "aforo_max": 25,
            "precio": Decimal("5000"),
            "estado": EstadoEvento.PUBLICADO,
        },
        {
            "nombre": "Feria de Emprendimiento Estudiantil",
            "descripcion": "Exposición de proyectos y startups desarrolladas por estudiantes.",
            "categoria": "Feria",
            "organizacion": "Escuela de Ingeniería UNAB",
            "fecha": hoy + timedelta(days=8),
            "lugar": "Explanada Campus Viña del Mar",
            "latitud": -33.0238,
            "longitud": -71.5531,
            "exterior": True,
            "aforo_max": 150,
            "precio": Decimal("0"),
            "estado": EstadoEvento.PUBLICADO,
        },
        {
            "nombre": "Taller de Diseño de Redes",
            "descripcion": "Práctica guiada de diseño de topologías de red para pymes.",
            "categoria": "Taller",
            "organizacion": "Centro de Estudiantes de Informática",
            "fecha": hoy + timedelta(days=11),
            "lugar": "Sala de Redes, Edificio C",
            "latitud": -33.0247,
            "longitud": -71.5495,
            "exterior": False,
            "aforo_max": 20,
            "precio": Decimal("8000"),
            "estado": EstadoEvento.PUBLICADO,
        },
        {
            "nombre": "Jornada Deportiva Interfacultades",
            "descripcion": "Competencias recreativas al aire libre entre facultades.",
            "categoria": "Feria",
            "organizacion": "Dirección de Deportes UNAB",
            "fecha": hoy + timedelta(days=14),
            "lugar": "Canchas Deportivas, Campus Viña del Mar",
            "latitud": -33.0229,
            "longitud": -71.5542,
            "exterior": True,
            "aforo_max": 120,
            "precio": Decimal("0"),
            "estado": EstadoEvento.PUBLICADO,
        },
        {
            "nombre": "Congreso de Innovación Regional",
            "descripcion": "",  # sin descripción: sirve para demostrar la validación al publicar
            "categoria": "Seminario",
            "organizacion": "Escuela de Ingeniería UNAB",
            "fecha": hoy + timedelta(days=20),
            "lugar": "Por confirmar",
            "latitud": None,
            "longitud": None,
            "exterior": False,
            "aforo_max": 200,
            "precio": Decimal("12000"),
            "estado": EstadoEvento.BORRADOR,
        },
    ]


def sembrar(db: Session) -> None:
    hoy = date.today()

    # --- Categorías ---
    for nombre in CATEGORIAS:
        if not db.scalar(select(Categoria).where(Categoria.nombre == nombre)):
            db.add(Categoria(nombre=nombre))
    db.commit()

    categorias = {c.nombre: c for c in db.scalars(select(Categoria))}

    # --- Organizadores ---
    for datos in ORGANIZADORES:
        usuario = db.scalar(select(Usuario).where(Usuario.email == datos["email"]))
        if usuario is None:
            usuario = Usuario(
                nombre=datos["nombre"],
                email=datos["email"],
                rol=RolUsuario.ORGANIZADOR,
            )
            db.add(usuario)
            db.flush()

        if usuario.organizador is None:
            db.add(
                Organizador(
                    usuario_id=usuario.id,
                    nombre_organizacion=datos["organizacion"],
                    descripcion=datos["descripcion"],
                )
            )
    db.commit()

    organizadores = {
        o.nombre_organizacion: o for o in db.scalars(select(Organizador))
    }

    # --- Asistentes de prueba ---
    for datos in ASISTENTES:
        if not db.scalar(select(Usuario).where(Usuario.email == datos["email"])):
            db.add(Usuario(**datos, rol=RolUsuario.ASISTENTE))
    db.commit()

    # --- Eventos ---
    for datos in _eventos(hoy):
        if db.scalar(select(Evento).where(Evento.nombre == datos["nombre"])):
            continue

        db.add(
            Evento(
                organizador_id=organizadores[datos["organizacion"]].id,
                categoria_id=categorias[datos["categoria"]].id,
                nombre=datos["nombre"],
                descripcion=datos["descripcion"],
                fecha=datos["fecha"],
                lugar=datos["lugar"],
                latitud=datos["latitud"],
                longitud=datos["longitud"],
                exterior=datos["exterior"],
                aforo_max=datos["aforo_max"],
                precio=datos["precio"],
                estado=datos["estado"],
            )
        )
    db.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        sembrar(db)
        total_eventos = len(list(db.scalars(select(Evento))))
        total_usuarios = len(list(db.scalars(select(Usuario))))
    print(f"Datos de prueba cargados: {total_eventos} eventos, {total_usuarios} usuarios.")


if __name__ == "__main__":
    main()
