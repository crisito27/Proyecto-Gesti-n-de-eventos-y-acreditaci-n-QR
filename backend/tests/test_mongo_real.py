"""Prueba opcional de integración contra un MongoDB real.

No reemplaza las pruebas con mongomock: verifica escritura y lectura por HTTP
usando una colección aislada dentro del servidor levantado con Docker Compose.
Activación: RUN_MONGO_INTEGRACION=1 python -m pytest tests/ -v.
"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.mongo import get_mongo_db, get_registros
from app.main import app


@pytest.mark.skipif(
    os.getenv("RUN_MONGO_INTEGRACION") != "1",
    reason="Requiere MongoDB real; activar RUN_MONGO_INTEGRACION=1",
)
def test_bitacora_acreditacion_en_mongo_real():
    registros = get_mongo_db()["registros_acceso_pruebas_integracion"]
    codigo = f"EVQR-TEST-{uuid.uuid4().hex[:12]}".upper()
    app.dependency_overrides[get_registros] = lambda: registros

    try:
        with TestClient(app) as cliente:
            respuesta = cliente.post(
                "/api/acreditaciones",
                json={"codigo": codigo, "puerta": "integracion"},
            )
            assert respuesta.status_code == 200, respuesta.text
            assert respuesta.json()["resultado"] == "codigo_invalido"

            lectura = cliente.get("/api/registros-acceso", params={"limite": 500})
            assert lectura.status_code == 200, lectura.text
            assert any(
                registro["codigo"] == codigo
                and registro["resultado"] == "codigo_invalido"
                and registro["puerta"] == "integracion"
                for registro in lectura.json()
            )

        documento = registros.find_one({"codigo": codigo})
        assert documento is not None
        assert documento["evento_id"] is None
    finally:
        registros.delete_many({"codigo": codigo})
        app.dependency_overrides.pop(get_registros, None)
