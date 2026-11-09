"""Canal WebSocket para actualizaciones en tiempo real."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.realtime import gestor_realtime

router = APIRouter(tags=["Tiempo real"])


@router.websocket("/ws")
async def websocket_actualizaciones(websocket: WebSocket):
    """Mantiene una conexión y distribuye eventos de cambios del dominio."""
    await gestor_realtime.conectar(websocket)
    try:
        while True:
            # El cliente puede enviar ping; recibir mantiene viva la conexión.
            await websocket.receive_text()
    except WebSocketDisconnect:
        # El cierre normal del navegador no debe generar un error del servidor.
        pass
    finally:
        # También libera la conexión ante cancelaciones o errores inesperados.
        await gestor_realtime.desconectar(websocket)
