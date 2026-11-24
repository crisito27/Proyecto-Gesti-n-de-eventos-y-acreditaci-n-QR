/**
 * Normaliza una dirección de FastAPI de AcreditaQR.
 * Admite http en LAN y https en servidores publicados.
 * La ruta /api es obligatoria para los endpoints de la app.
 */
export function normalizarUrlApi(valor) {
  const entrada = String(valor || "").trim();
  if (!entrada) throw new Error("Escribe la dirección del servidor.");

  let url;
  try {
    url = new URL(entrada);
  } catch (_) {
    throw new Error("Dirección inválida. Ejemplo: http://192.168.1.50:8000");
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
    throw new Error("Utiliza una dirección http:// o https:// válida.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("La dirección no debe incluir credenciales, parámetros ni fragmentos.");
  }

  const ruta = url.pathname.replace(/\/+$/, "");
  if (ruta && ruta !== "/api") {
    throw new Error("La dirección debe terminar en /api o no tener ruta.");
  }
  return url.origin + "/api";
}

export function urlSalud(urlApi) {
  return normalizarUrlApi(urlApi).slice(0, -4) + "/salud";
}

export function urlWebSocket(urlApi) {
  return normalizarUrlApi(urlApi).replace(/^http/, "ws").replace(/\/api$/, "/ws");
}
