"""Pruebas del flujo completo y de las reglas de negocio.

Cubren lo que el Hito 3 pide demostrar en el punto 8:
  · un flujo principal completo del dominio;
  · una operación persistida en PostgreSQL y consultable después;
  · una funcionalidad que escribe y consulta en MongoDB;
  · reglas de negocio relevantes;
  · casos de error y su respuesta.
"""

import mongomock
import pytest
from fastapi.testclient import TestClient

from app.core.mongo import get_registros
from app.main import app


@pytest.fixture()
def registros():
    """Colección de MongoDB en memoria, para no depender de un servidor."""
    cliente = mongomock.MongoClient()
    return cliente["pruebas"]["registros_acceso"]


@pytest.fixture()
def cliente(registros):
    app.dependency_overrides[get_registros] = lambda: registros
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def evento_pagado(cliente):
    """Crea un evento con precio, publicado y con aforo de 2 personas."""
    categorias = cliente.get("/api/categorias").json()
    organizadores = cliente.get("/api/organizadores").json()
    assert categorias and organizadores, "Ejecuta `python -m app.seed` antes de las pruebas"

    respuesta = cliente.post(
        "/api/eventos",
        json={
            "organizador_id": organizadores[0]["id"],
            "categoria_id": categorias[0]["id"],
            "nombre": "Evento de prueba automatizada",
            "descripcion": "Creado por la suite de pruebas.",
            "fecha": "2030-01-15",
            "lugar": "Sala de pruebas",
            "latitud": -33.02,
            "longitud": -71.55,
            "aforo_max": 2,
            "precio": "5000.00",
        },
    )
    assert respuesta.status_code == 201, respuesta.text
    evento = respuesta.json()

    publicado = cliente.post(f"/api/eventos/{evento['id']}/publicar")
    assert publicado.status_code == 200, publicado.text
    return publicado.json()


def _inscribir(cliente, evento_id, nombre, email):
    return cliente.post(
        "/api/inscripciones/publica",
        json={
            "evento_id": evento_id,
            "nombre": nombre,
            "email": email,
            "telefono": "912345678",
        },
    )


# --------------------------------------------------------------------------

def test_salud(cliente):
    assert cliente.get("/salud").json()["estado"] == "ok"


def test_swagger_disponible(cliente):
    assert cliente.get("/docs").status_code == 200
    esquema = cliente.get("/openapi.json").json()
    assert "/api/acreditaciones" in esquema["paths"]


def test_listado_de_eventos_trae_cupos_calculados(cliente):
    eventos = cliente.get("/api/eventos").json()
    assert eventos, "El seed debe haber cargado eventos"
    for evento in eventos:
        assert evento["cupos_disponibles"] == max(
            evento["aforo_max"] - evento["inscritos"], 0
        )


def test_flujo_completo_inscripcion_pago_y_acreditacion(cliente, evento_pagado, registros):
    evento_id = evento_pagado["id"]

    # 1. Inscripción -> queda pendiente de pago porque el evento tiene precio.
    inscripcion = _inscribir(cliente, evento_id, "Ana Pérez", "ana.flujo@ejemplo.cl")
    assert inscripcion.status_code == 201, inscripcion.text
    datos = inscripcion.json()
    assert datos["estado"] == "pendiente_pago"
    codigo = datos["codigo"]

    # 2. Acreditar sin pago debe ser rechazado y quedar registrado en Mongo.
    rechazo = cliente.post("/api/acreditaciones", json={"codigo": codigo}).json()
    assert rechazo["resultado"] == "sin_pago"

    # 3. Pago simulado -> emite comprobante y confirma la inscripción.
    pago = cliente.post(
        "/api/pagos", json={"inscripcion_id": datos["id"], "metodo": "tarjeta"}
    )
    assert pago.status_code == 201, pago.text
    pago_datos = pago.json()
    assert pago_datos["estado"] == "pagado"
    assert pago_datos["numero_comprobante"].startswith("CMP-")

    comprobante = cliente.get(f"/api/pagos/{pago_datos['id']}/comprobante").json()
    assert comprobante["codigo_acreditacion"] == codigo
    assert comprobante["asistente"] == "Ana Pérez"

    # 4. Ahora sí acredita.
    ok = cliente.post("/api/acreditaciones", json={"codigo": codigo}).json()
    assert ok["resultado"] == "acreditado"
    assert ok["asistente"] == "Ana Pérez"

    # 5. Persistido en PostgreSQL y consultable después.
    recuperada = cliente.get(f"/api/inscripciones/{datos['id']}").json()
    assert recuperada["estado"] == "acreditada"
    assert recuperada["acreditada_en"] is not None

    # 6. Segundo intento con el mismo código -> duplicado.
    duplicado = cliente.post("/api/acreditaciones", json={"codigo": codigo}).json()
    assert duplicado["resultado"] == "duplicado"

    # 7. Los tres intentos quedaron en MongoDB.
    assert registros.count_documents({"codigo": codigo}) == 3
    resultados = {d["resultado"] for d in registros.find({"codigo": codigo})}
    assert resultados == {"sin_pago", "acreditado", "duplicado"}


def test_no_permite_doble_inscripcion(cliente, evento_pagado):
    evento_id = evento_pagado["id"]
    primera = _inscribir(cliente, evento_id, "Bruno Díaz", "bruno.doble@ejemplo.cl")
    assert primera.status_code == 201

    segunda = _inscribir(cliente, evento_id, "Bruno Díaz", "bruno.doble@ejemplo.cl")
    assert segunda.status_code == 409
    assert segunda.json()["codigo"] == "inscripcion_duplicada"


def test_no_permite_superar_el_aforo(cliente, evento_pagado):
    evento_id = evento_pagado["id"]  # aforo_max = 2

    assert _inscribir(cliente, evento_id, "Uno", "cupo1@ejemplo.cl").status_code == 201
    assert _inscribir(cliente, evento_id, "Dos", "cupo2@ejemplo.cl").status_code == 201

    tercera = _inscribir(cliente, evento_id, "Tres", "cupo3@ejemplo.cl")
    assert tercera.status_code == 409
    assert tercera.json()["codigo"] == "aforo_completo"


def test_cancelar_libera_el_cupo(cliente, evento_pagado):
    evento_id = evento_pagado["id"]
    primera = _inscribir(cliente, evento_id, "Uno", "libera1@ejemplo.cl").json()
    _inscribir(cliente, evento_id, "Dos", "libera2@ejemplo.cl")

    assert _inscribir(cliente, evento_id, "Tres", "libera3@ejemplo.cl").status_code == 409

    cancelada = cliente.post(f"/api/inscripciones/{primera['id']}/cancelar")
    assert cancelada.status_code == 200
    assert cancelada.json()["estado"] == "cancelada"

    # Liberado el cupo, la tercera persona ya puede inscribirse.
    assert _inscribir(cliente, evento_id, "Tres", "libera3@ejemplo.cl").status_code == 201


def test_no_permite_inscribirse_en_evento_borrador(cliente):
    organizadores = cliente.get("/api/organizadores").json()
    categorias = cliente.get("/api/categorias").json()
    borrador = cliente.post(
        "/api/eventos",
        json={
            "organizador_id": organizadores[0]["id"],
            "categoria_id": categorias[0]["id"],
            "nombre": "Evento todavía en borrador",
            "descripcion": "No publicado.",
            "fecha": "2030-02-20",
            "lugar": "Sala X",
            "aforo_max": 10,
            "precio": "0",
        },
    ).json()

    respuesta = _inscribir(cliente, borrador["id"], "Carla", "carla.borrador@ejemplo.cl")
    assert respuesta.status_code == 422
    assert respuesta.json()["codigo"] == "evento_no_publicado"


def test_no_publica_evento_sin_descripcion(cliente):
    organizadores = cliente.get("/api/organizadores").json()
    categorias = cliente.get("/api/categorias").json()
    evento = cliente.post(
        "/api/eventos",
        json={
            "organizador_id": organizadores[0]["id"],
            "categoria_id": categorias[0]["id"],
            "nombre": "Evento sin descripcion alguna",
            "descripcion": "",
            "fecha": "2030-03-10",
            "lugar": "Sala Y",
            "aforo_max": 10,
            "precio": "0",
        },
    ).json()

    respuesta = cliente.post(f"/api/eventos/{evento['id']}/publicar")
    assert respuesta.status_code == 422
    assert respuesta.json()["codigo"] == "descripcion_requerida"


def test_no_reduce_aforo_bajo_inscritos(cliente, evento_pagado):
    evento_id = evento_pagado["id"]
    _inscribir(cliente, evento_id, "Uno", "aforo1@ejemplo.cl")
    _inscribir(cliente, evento_id, "Dos", "aforo2@ejemplo.cl")

    respuesta = cliente.put(f"/api/eventos/{evento_id}", json={"aforo_max": 1})
    assert respuesta.status_code == 409
    assert respuesta.json()["codigo"] == "aforo_menor_que_inscritos"


def test_codigo_invalido_queda_registrado_en_mongo(cliente, registros):
    respuesta = cliente.post(
        "/api/acreditaciones", json={"codigo": "EVQR-NOEXISTE-0000", "puerta": "lateral"}
    ).json()
    assert respuesta["resultado"] == "codigo_invalido"

    documento = registros.find_one({"codigo": "EVQR-NOEXISTE-0000"})
    assert documento is not None
    assert documento["puerta"] == "lateral"
    assert documento["evento_id"] is None


def test_resumen_participacion_agrega_en_mongo(cliente, evento_pagado, registros):
    evento_id = evento_pagado["id"]
    inscripcion = _inscribir(cliente, evento_id, "Eva", "eva.resumen@ejemplo.cl").json()
    cliente.post("/api/pagos", json={"inscripcion_id": inscripcion["id"]})

    cliente.post("/api/acreditaciones", json={"codigo": inscripcion["codigo"]})
    cliente.post("/api/acreditaciones", json={"codigo": inscripcion["codigo"]})
    cliente.post("/api/acreditaciones", json={"codigo": "EVQR-FALSO-123"})

    resumen = cliente.get(f"/api/eventos/{evento_id}/participacion").json()
    assert resumen["acreditados"] == 1
    assert resumen["duplicados"] == 1
    assert resumen["total_intentos"] >= 2


def test_validacion_de_entrada_devuelve_422(cliente, evento_pagado):
    respuesta = cliente.post(
        "/api/inscripciones/publica",
        json={
            "evento_id": evento_pagado["id"],
            "nombre": "A",                  # demasiado corto
            "email": "no-es-un-correo",     # formato inválido
            "telefono": "abc",              # no son dígitos
        },
    )
    assert respuesta.status_code == 422


def test_recurso_inexistente_devuelve_404(cliente):
    respuesta = cliente.get("/api/eventos/999999")
    assert respuesta.status_code == 404
    assert respuesta.json()["codigo"] == "no_encontrado"


def test_indicadores_reflejan_las_inscripciones(cliente, evento_pagado):
    evento_id = evento_pagado["id"]
    inscripcion = _inscribir(cliente, evento_id, "Fran", "fran.ind@ejemplo.cl").json()
    cliente.post("/api/pagos", json={"inscripcion_id": inscripcion["id"]})

    indicadores = cliente.get("/api/indicadores").json()
    fila = next(e for e in indicadores["por_evento"] if e["evento_id"] == evento_id)
    assert fila["inscritos"] == 1
    assert fila["confirmados"] == 1
    assert fila["recaudado"] == 5000.0
    assert fila["cupos_disponibles"] == 1


def test_websocket_notifica_cambios_reales_del_backend(cliente):
    """Un cambio persistido por REST se publica a los clientes WebSocket."""
    categorias = cliente.get("/api/categorias").json()
    organizadores = cliente.get("/api/organizadores").json()
    assert categorias and organizadores, "Ejecuta `python -m app.seed` antes de las pruebas"

    with cliente.websocket_connect("/ws") as websocket:
        respuesta = cliente.post(
            "/api/eventos",
            json={
                "organizador_id": organizadores[0]["id"],
                "categoria_id": categorias[0]["id"],
                "nombre": "Evento de prueba WebSocket",
                "descripcion": "Verifica la notificación en tiempo real.",
                "fecha": "2030-01-15",
                "lugar": "Sala de pruebas",
                "aforo_max": 20,
                "precio": "0",
            },
        )

        assert respuesta.status_code == 201, respuesta.text
        mensaje = websocket.receive_json()

    assert mensaje == {
        "tipo": "evento.creado",
        "recurso": "eventos",
        "recurso_id": respuesta.json()["id"],
    }
