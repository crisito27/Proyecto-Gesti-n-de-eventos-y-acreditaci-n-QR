"""Gestor WebSocket en memoria para notificar cambios a clientes conectados.

Para una instancia única de FastAPI es suficiente. En despliegues con varios
workers/instancias debe sustituirse el fan-out local por Redis Pub/Sub.
"""
import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("acreditaqr.realtime")


class GestorRealtime:
    def __init__(self) -> None:
        self._clientes: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def conectar(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._clientes.add(websocket)

    async def desconectar(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clientes.discard(websocket)

    async def publicar(self, tipo: str, recurso: str, recurso_id: int | None = None) -> None:
        mensaje: dict[str, Any] = {
            "tipo": tipo,
            "recurso": recurso,
            "recurso_id": recurso_id,
        }
        payload = json.dumps(mensaje, ensure_ascii=False)
        async with self._lock:
            clientes = tuple(self._clientes)
        if not clientes:
            return
        resultados = await asyncio.gather(
            *(cliente.send_text(payload) for cliente in clientes),
            return_exceptions=True,
        )
        fallidos = [cliente for cliente, resultado in zip(clientes, resultados) if isinstance(resultado, Exception)]
        if fallidos:
            async with self._lock:
                for cliente in fallidos:
                    self._clientes.discard(cliente)


gestor_realtime = GestorRealtime()


def notificar_cambio(tipo: str, recurso: str, recurso_id: int | None = None) -> None:
    """Punto de entrada síncrono para endpoints FastAPI síncronos."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(gestor_realtime.publicar(tipo, recurso, recurso_id))
    except RuntimeError:
        logger.warning("No hay event loop activo; se omitió notificación realtime")
