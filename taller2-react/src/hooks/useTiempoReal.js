import { useEffect, useRef, useState } from "react";
import { URL_BASE } from "../services/apiCliente";

function construirUrlWebSocket() {
  const url = new URL(URL_BASE);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/api\/?$/, "/ws");
  url.search = "";
  return url.toString();
}

/** Escucha eventos del backend y reconecta con espera incremental. */
export function useTiempoReal(onEvento) {
  const callbackRef = useRef(onEvento);
  const [estado, setEstado] = useState("conectando");

  useEffect(() => {
    callbackRef.current = onEvento;
  }, [onEvento]);

  useEffect(() => {
    let socket;
    let timer;
    let intento = 0;
    let desmontado = false;

    const conectar = () => {
      if (desmontado) return;
      setEstado("conectando");
      socket = new WebSocket(construirUrlWebSocket());

      socket.onopen = () => {
        intento = 0;
        setEstado("conectado");
        socket.send("suscrito");
      };
      socket.onmessage = (mensaje) => {
        try {
          callbackRef.current?.(JSON.parse(mensaje.data));
        } catch {
          // Se ignoran mensajes no JSON sin interrumpir la conexión.
        }
      };
      socket.onerror = () => setEstado("desconectado");
      socket.onclose = () => {
        setEstado("desconectado");
        if (!desmontado) {
          const espera = Math.min(1000 * 2 ** intento, 15000);
          intento += 1;
          timer = window.setTimeout(conectar, espera);
        }
      };
    };

    conectar();
    return () => {
      desmontado = true;
      window.clearTimeout(timer);
      socket?.close();
    };
  }, []);

  return estado;
}
