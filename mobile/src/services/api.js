import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { obtenerUrlApi } from "./serverConfig";

const TOKEN_KEY = "acredita_qr_access_token";

export class ApiError extends Error {
  constructor(message, code = "api_error", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function guardarToken(token) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function obtenerToken() {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function eliminarToken() {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request(path, options = {}) {
  const API_URL = obtenerUrlApi();
  if (!API_URL) {
    throw new ApiError(
      "Abre la pestaña Ajustes y configura la dirección del servidor.",
      "configuracion",
      0
    );
  }

  const token = await obtenerToken();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (_) {
    throw new ApiError(
      "No se pudo conectar con Acredita QR. Comprueba la URL, la Wi-Fi y que el backend esté activo.",
      "sin_conexion",
      0
    );
  }

  if (response.status === 204) return null;

  let body = null;

  try {
    body = await response.json();
  } catch (_) {}

  if (!response.ok) {
    const message =
      body?.mensaje ||
      body?.detail ||
      `Error HTTP ${response.status}`;

    throw new ApiError(
      typeof message === "string" ? message : JSON.stringify(message),
      body?.codigo || "http_error",
      response.status
    );
  }

  return body;
}

const query = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  return entries.length
    ? `?${new URLSearchParams(entries).toString()}`
    : "";
};

export const api = {
  get: (path, params, options = {}) =>
    request(`${path}${query(params)}`, options),

  post: (path, data, options = {}) =>
    request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
};

export const apiFunciones = {
  login: (email, clave) =>
    api.post("/auth/login", { email: email.trim(), clave }),

  yo: () => api.get("/auth/yo"),

  indicadores: () => api.get("/indicadores"),

  // El catálogo de la aplicación es público, igual que el de la web: sólo
  // muestra eventos publicados. Un borrador es un evento que el organizador
  // todavía está preparando, y para el asistente no debería existir.
  eventos: () => api.get("/eventos", { estado: "publicado" }),

  inscribirse: (datos) =>
    api.post("/inscripciones/publica", {
      evento_id: Number(datos.evento_id),
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      telefono: datos.telefono.replace(/\D/g, ""),
    }),

  obtenerInscripcion: (inscripcionId, codigo) =>
    api.get(
      `/inscripciones/${Number(inscripcionId)}`,
      undefined,
      { headers: { "X-Codigo-Entrada": codigo } }
    ),

  pagar: (inscripcionId, codigo, metodo = "tarjeta") =>
    api.post(
      "/pagos",
      {
        inscripcion_id: Number(inscripcionId),
        metodo,
      },
      {
        headers: { "X-Codigo-Entrada": codigo },
      }
    ),

  // El comprobante sólo lo entrega el backend a quien posee el código
  // original de la entrada, que viaja en la cabecera X-Codigo-Entrada.
  comprobante: (pagoId, codigo) =>
    api.get(
      `/pagos/${Number(pagoId)}/comprobante`,
      undefined,
      { headers: { "X-Codigo-Entrada": codigo } }
    ),

  acreditar: (codigo, puerta = "principal") =>
    api.post("/acreditaciones", {
      codigo: codigo.trim(),
      puerta,
    }),

  registros: (eventoId, limite = 100) =>
    api.get("/registros-acceso", {
      evento_id: eventoId,
      limite,
    }),
};