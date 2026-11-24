import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { normalizarUrlApi, urlSalud, urlWebSocket } from "./urlUtils";

const CLAVE = "acreditaqr_servidor_api_v1";
const PREDETERMINADA = process.env.EXPO_PUBLIC_API_URL || "";
let actual = "";

try {
  actual = PREDETERMINADA ? normalizarUrlApi(PREDETERMINADA) : "";
} catch (_) {
  actual = "";
}

export { normalizarUrlApi };

export function obtenerUrlApi() {
  return actual;
}

export async function cargarUrlApi() {
  let valor = null;
  if (Platform.OS === "web") {
    valor = typeof localStorage === "undefined" ? null : localStorage.getItem(CLAVE);
  } else {
    valor = await SecureStore.getItemAsync(CLAVE);
  }
  if (valor) {
    try {
      actual = normalizarUrlApi(valor);
    } catch (_) {
      actual = "";
    }
  }
  return actual;
}

export async function guardarUrlApi(valor) {
  const normalizada = normalizarUrlApi(valor);
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(CLAVE, normalizada);
  } else {
    await SecureStore.setItemAsync(CLAVE, normalizada);
  }
  actual = normalizada;
  return actual;
}

export function obtenerUrlWebSocket(urlApi = actual) {
  if (!urlApi) return "";
  const wsFija = process.env.EXPO_PUBLIC_WS_URL;
  const apiFija = process.env.EXPO_PUBLIC_API_URL;
  if (wsFija && apiFija && normalizarUrlApi(apiFija) === urlApi) return wsFija;
  return urlWebSocket(urlApi);
}

export async function probarConexion(valor) {
  const destino = urlSalud(valor);
  const controller = new AbortController();
  const reloj = setTimeout(() => controller.abort(), 8000);
  const comienzo = Date.now();
  try {
    const respuesta = await fetch(destino, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!respuesta.ok) throw new Error("El servidor respondió HTTP " + respuesta.status + ".");
    const datos = await respuesta.json();
    if (datos?.estado !== "ok") throw new Error("El servidor no reconoció la comprobación de salud.");
    return {
      servicio: datos.servicio || "AcreditaQR",
      version: datos.version || "sin versión",
      latenciaMs: Date.now() - comienzo,
    };
  } catch (error) {
    if (error.name === "AbortError") throw new Error("El servidor no respondió en 8 segundos.");
    throw error;
  } finally {
    clearTimeout(reloj);
  }
}
