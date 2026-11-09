"""Punto de entrada de la API.

Monta los routers, configura CORS para el frontend React y traduce los
errores de dominio a respuestas HTTP con una forma única.

La documentación interactiva Swagger queda en /docs y el esquema OpenAPI en
/openapi.json. FastAPI la genera a partir de los esquemas Pydantic, así que
no puede quedar desalineada de lo que la API realmente acepta y devuelve.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine
from app.core.errores import ErrorDominio
from app.core.mongo import crear_indices
from app.routers import acreditaciones, eventos, indicadores, inscripciones, pagos, realtime, usuarios

logger = logging.getLogger("acreditaqr")

DESCRIPCION = """
API de **AcreditaQR**, plataforma de gestión de eventos y acreditación de
asistentes.

Continúa el prototipo React del Taller 2 y lo convierte en una solución full
stack con persistencia real.

### Persistencia

* **PostgreSQL** — estado del dominio: usuarios, organizadores, categorías,
  eventos, inscripciones y pagos simulados.
* **MongoDB** — bitácora de acceso: cada intento de acreditación en la puerta,
  haya resultado exitoso o rechazado.

### Reglas de negocio demostrables

* No es posible inscribirse dos veces en el mismo evento.
* No es posible superar el aforo del evento.
* No es posible acreditar una entrada sin pago confirmado.
* No es posible acreditar dos veces la misma entrada.
* No es posible reducir el aforo por debajo de los inscritos.
"""


@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    """Se ejecuta al arrancar y al apagar la aplicación."""
    # Crea las tablas si no existen. En un proyecto en producción esto lo
    # haría una herramienta de migraciones; aquí basta y es reproducible.
    Base.metadata.create_all(bind=engine)

    try:
        crear_indices()
    except Exception as exc:  # noqa: BLE001
        # La API puede arrancar sin Mongo: sólo quedan inhabilitadas las
        # funcionalidades de bitácora, y el error se registra en el log.
        logger.warning("No se pudieron crear los índices de MongoDB: %s", exc)

    yield


app = FastAPI(
    title=settings.app_nombre,
    version=settings.app_version,
    description=DESCRIPCION,
    lifespan=ciclo_de_vida,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.lista_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Manejo de errores
# --------------------------------------------------------------------------

@app.exception_handler(ErrorDominio)
async def manejar_error_dominio(request: Request, exc: ErrorDominio) -> JSONResponse:
    """Traduce los errores de negocio a HTTP con una forma única."""
    return JSONResponse(
        status_code=exc.estado_http,
        content={"codigo": exc.codigo, "mensaje": exc.mensaje},
    )


@app.exception_handler(Exception)
async def manejar_error_inesperado(request: Request, exc: Exception) -> JSONResponse:
    """Cualquier fallo no previsto.

    El detalle queda en el log del servidor; al cliente sólo le llega un
    mensaje genérico. Nunca se exponen trazas, consultas ni credenciales.
    """
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "codigo": "error_interno",
            "mensaje": "Ocurrió un error inesperado en el servidor.",
        },
    )


# --------------------------------------------------------------------------
# Rutas
# --------------------------------------------------------------------------

@app.get("/salud", tags=["Sistema"], summary="Estado del servicio")
def salud():
    """Comprueba que la API responde. Lo usa Docker como healthcheck."""
    return {"estado": "ok", "servicio": settings.app_nombre, "version": settings.app_version}


PREFIJO = "/api"
app.include_router(usuarios.router, prefix=PREFIJO)
app.include_router(eventos.router, prefix=PREFIJO)
app.include_router(inscripciones.router, prefix=PREFIJO)
app.include_router(pagos.router, prefix=PREFIJO)
app.include_router(acreditaciones.router, prefix=PREFIJO)
app.include_router(indicadores.router, prefix=PREFIJO)
app.include_router(realtime.router)
