const API_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, code = "api_error", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new ApiError("Configura EXPO_PUBLIC_API_URL en mobile/.env con la dirección del backend.", "configuracion", 0);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (error) {
    throw new ApiError("No se pudo conectar con Acredita QR. Comprueba la URL, la Wi-Fi y que el backend esté activo.", "sin_conexion", 0);
  }

  if (response.status === 204) return null;

  let body = null;
  try { body = await response.json(); } catch (_) {}

  if (!response.ok) {
    const message = body?.mensaje || body?.detail || `Error HTTP ${response.status}`;
    throw new ApiError(typeof message === "string" ? message : JSON.stringify(message), body?.codigo || "http_error", response.status);
  }
  return body;
}

const query = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
};

export const api = {
  get: (path, params) => request(`${path}${query(params)}`),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data || {}) }),
};

export const apiFunciones = {
  indicadores: () => api.get("/indicadores"),
  eventos: () => api.get("/eventos"),
  inscribirse: (datos) => api.post("/inscripciones/publica", {
    evento_id: Number(datos.evento_id),
    nombre: datos.nombre.trim(),
    email: datos.email.trim(),
    telefono: datos.telefono.replace(/\D/g, ""),
  }),
  pagar: (inscripcionId, metodo = "tarjeta") => api.post("/pagos", { inscripcion_id: Number(inscripcionId), metodo }),
  acreditar: (codigo, puerta = "principal") => api.post("/acreditaciones", { codigo: codigo.trim(), puerta }),
  registros: (eventoId, limite = 100) => api.get("/registros-acceso", { evento_id: eventoId, limite }),
};
