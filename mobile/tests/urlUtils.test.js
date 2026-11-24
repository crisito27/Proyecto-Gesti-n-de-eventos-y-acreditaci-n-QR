import test from "node:test";
import assert from "node:assert/strict";
import { normalizarUrlApi, urlSalud, urlWebSocket } from "../src/services/urlUtils.js";

test("añade /api al servidor local", () => {
  assert.equal(normalizarUrlApi("http://192.168.1.50:8000"), "http://192.168.1.50:8000/api");
});
test("no duplica /api y elimina espacios", () => {
  assert.equal(normalizarUrlApi(" https://ejemplo.cl/api/  "), "https://ejemplo.cl/api");
});
test("calcula URL de salud y websocket", () => {
  assert.equal(urlSalud("https://ejemplo.cl/api"), "https://ejemplo.cl/salud");
  assert.equal(urlWebSocket("http://192.168.1.50:8000/api"), "ws://192.168.1.50:8000/ws");
});
test("rechaza protocolo no web, rutas incorrectas y credenciales", () => {
  for (const valor of ["", "file:///tmp/a", "http://x/otra-ruta", "http://usuario:clave@x", "https://x/api?token=123"]) {
    assert.throws(() => normalizarUrlApi(valor));
  }
});
