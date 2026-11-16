/* Prueba de navegador REAL de la demo estática, nunca evidencia de SQL/Mongo. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:4173/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR/";
const dir = "evidencias-navegador";
await fs.mkdir(dir, { recursive: true });
const navegador = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
const errores = [];
pagina.on("pageerror", (error) => errores.push(error.message));

async function captura(nombre) {
  await pagina.screenshot({ path: `${dir}/${nombre}.png`, fullPage: true });
}
async function inscribir(indice, nombre, email) {
  const tarjeta = pagina.locator(".card-evento").nth(indice);
  await tarjeta.getByRole("button", { name: "Inscribirme" }).click();
  await pagina.locator("#inscripcion-nombre").fill(nombre);
  await pagina.locator("#inscripcion-email").fill(email);
  await pagina.locator("#inscripcion-telefono").fill("912345678");
  await pagina.getByRole("button", { name: "Confirmar inscripción" }).click();
  await pagina.locator(".ticket-codigo").waitFor({ state: "visible" });
  const codigo = await pagina.locator(".ticket-codigo").textContent();
  assert.match(codigo, /^EVQR-DEMO-/);
  return codigo;
}
try {
  const respuesta = await pagina.goto(base, { waitUntil: "networkidle" });
  assert.equal(respuesta.status(), 200);
  await pagina.getByRole("heading", { name: "Encuentra tu próximo evento" }).waitFor();
  await pagina.getByText("Demostración interactiva").first().waitFor();
  await pagina.locator(".card-evento").first().waitFor();
  assert.equal(await pagina.locator(".card-evento").count(), 5);
  await captura("01-eventos-desktop");

  const codigoGratuito = await inscribir(0, "Asistente de Prueba", "asistente.demo@example.cl");
  await captura("02-inscripcion-gratuita");
  await pagina.getByRole("button", { name: "Organizador" }).click();
  await pagina.getByRole("button", { name: "Acreditación" }).click();
  await pagina.locator("#codigo-acreditacion").fill(codigoGratuito);
  await pagina.getByRole("button", { name: "Acreditar", exact: true }).click();
  await pagina.getByText("Acreditación registrada en esta demostración.").waitFor();
  await captura("03-acreditacion-valida");
  await pagina.locator("#codigo-acreditacion").fill(codigoGratuito);
  await pagina.getByRole("button", { name: "Acreditar", exact: true }).click();
  await pagina.getByText("La entrada ya fue acreditada.").waitFor();
  await captura("04-duplicado-rechazado");

  await pagina.getByRole("button", { name: "Eventos", exact: true }).click();
  await pagina.locator(".card-evento").nth(1).waitFor();
  const codigoPago = await inscribir(1, "Persona con Pago", "pago.demo@example.cl");
  assert.match(codigoPago, /^EVQR-DEMO-/);
  await pagina.getByRole("button", { name: "Pagar y emitir comprobante" }).click();
  await pagina.getByText("COMPROBANTE DE PAGO").waitFor();
  await captura("05-pago-y-comprobante");

  await pagina.getByRole("button", { name: "Organizador" }).click();
  await pagina.getByRole("button", { name: "Dashboard" }).click();
  await pagina.getByRole("heading", { name: "Dashboard de aforo" }).waitFor();
  await captura("06-dashboard");
  await pagina.getByRole("button", { name: "Bitácora" }).click();
  await pagina.getByRole("heading", { name: "Bitácora de accesos" }).waitFor();
  await captura("07-bitacora");

  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.getByRole("button", { name: "Eventos", exact: true }).click();
  await pagina.locator(".card-evento").first().waitFor();
  await captura("08-responsive-movil");

  assert.deepEqual(errores, []);
  console.log("E2E DEMO OK: catálogo, registro, QR, acreditación, duplicado, pago simulado, bitácora, dashboard y móvil.");
} finally {
  await navegador.close();
}
