import { obtenerUrlWebSocket } from "./serverConfig";

export function conectarRealtime(onChange, urlApi) {
  const WS_URL = obtenerUrlWebSocket(urlApi);
  if (!WS_URL) return () => {};
  let socket;
  let retryTimer;
  let pingTimer;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    try {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25000);
      };
      socket.onmessage = () => onChange?.();
      socket.onerror = () => {};
      socket.onclose = () => {
        clearInterval(pingTimer);
        if (!stopped) retryTimer = setTimeout(connect, 3000);
      };
    } catch (_) {
      if (!stopped) retryTimer = setTimeout(connect, 3000);
    }
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    clearInterval(pingTimer);
    try { socket?.close(); } catch (_) {}
  };
}
