"""Conexión a MongoDB.

Por qué existe esta base además de PostgreSQL
---------------------------------------------
PostgreSQL guarda el ESTADO del dominio: qué eventos hay, quién está inscrito,
qué pagos se registraron. Son datos relacionales, con integridad referencial,
que se consultan y se actualizan.

MongoDB guarda la BITÁCORA DE ACCESO: cada intento de acreditación en la puerta
del evento, haya resultado exitoso o no. Son hechos históricos con
características distintas:

  · Sólo se insertan, nunca se actualizan ni se borran (append-only).
  · Crecen mucho más rápido que las tablas: un evento con 150 asistentes puede
    generar 400 intentos entre reintentos, códigos erróneos y duplicados.
  · Cada tipo de intento acompaña información distinta. Un acceso denegado
    guarda el código que se tecleó mal; uno exitoso guarda la inscripción y el
    asistente. Forzar eso a una tabla relacional obligaría a dejar columnas
    nulas o a crear varias tablas para un mismo hecho.
  · No necesitan integridad referencial: son evidencia de lo que ocurrió en un
    instante, y deben conservarse tal cual aunque la inscripción cambie después.

No es una duplicación de SQL. La inscripción vive en PostgreSQL; aquí vive el
rastro de cada vez que alguien intentó usarla.
"""

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.config import settings

COLECCION_REGISTROS = "registros_acceso"

_cliente: MongoClient | None = None


def get_cliente() -> MongoClient:
    """Cliente de MongoDB, creado una sola vez por proceso.

    `tz_aware=True` es necesario: MongoDB almacena las fechas en UTC, pero
    PyMongo las devuelve sin zona horaria si no se le pide lo contrario. Al
    serializarlas, el JSON salía como `2026-11-23T16:10:52` —sin el sufijo que
    indica UTC— y el navegador las interpretaba como hora local, mostrando la
    bitácora tres horas adelantada. Con esta marca, la fecha viaja como
    `2026-11-23T16:10:52+00:00` y cada cliente la convierte a su propia zona.
    """
    global _cliente
    if _cliente is None:
        _cliente = MongoClient(
            settings.mongo_uri,
            serverSelectionTimeoutMS=5000,
            tz_aware=True,
        )
    return _cliente


def get_mongo_db() -> Database:
    return get_cliente()[settings.mongo_db]


def get_registros() -> Collection:
    """Colección de registros de acceso y participación."""
    return get_mongo_db()[COLECCION_REGISTROS]


def crear_indices() -> None:
    """Índices que sostienen las consultas que hace la aplicación.

    Se ejecuta al arrancar. `create_index` es idempotente: si el índice ya
    existe, no hace nada.
    """
    registros = get_registros()
    registros.create_index([("evento_id", ASCENDING), ("ocurrido_en", ASCENDING)])
    registros.create_index([("codigo", ASCENDING)])
    registros.create_index([("resultado", ASCENDING)])
