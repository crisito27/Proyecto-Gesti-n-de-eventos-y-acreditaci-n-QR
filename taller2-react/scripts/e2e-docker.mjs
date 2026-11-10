/* Verificación E2E del proyecto completo sobre Docker Compose.
   Capturas auténticas: React (Docker) -> FastAPI (Docker) -> PostgreSQL/MongoDB.
   Los datos creados son sintéticos, claramente identificados para la prueba.
*/
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const raiz = "http://127.0.0.1:5173/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR/";
const api = "http://127.0.0.1:8000";
const pruebas = "evidencias-docker";
const navegador = await chromium.launch({headless:true, args:["--no-sandbox"]});
const contexto = await navegador.newContext({ viewport: { width: 1320, height: 900 } });
const pagina = await contexto.newPage();
const errores = [];
pagina.on("pageerror", error=>errores.push(error.message));
await fs.mkdir(pruebas, {recursive:true});
const capturar = async (nombre, page=pagina)=>page.screenshot({path: pruebas+"/"+nombre+".png", fullPage:true});
const verificar = async (ruta, estado=200)=> {
 const respuesta = await pagina.request.get(api+ruta);
 assert.equal(respuesta.status(),estado, ruta);
 return respuesta.json();
};
try {
  await verificar("/salud");
  const respuesta = await pagina.goto(raiz,{waitUntil:"networkidle",timeout:60000});
  assert.equal(respuesta.status(),200);
  await pagina.getByRole("heading",{name:"Encuentra tu próximo evento"}).waitFor();
  assert.equal(await pagina.getByText("Demostración interactiva").count(),0);
  await pagina.locator(".card-evento").first().waitFor();
  await capturar("01-catalogo-react-docker");

  const tarjeta = pagina.locator(".card-evento").filter({hasText:"Capacitación en Git y control de versiones"});
  await tarjeta.getByRole("button",{name:"Inscribirme"}).click();
  await pagina.locator("#inscripcion-nombre").fill("Persona de prueba Docker");
  await pagina.locator("#inscripcion-email").fill("docker.evidencia@example.cl");
  await pagina.locator("#inscripcion-telefono").fill("912345678");
  await capturar("02-formulario-inscripcion-docker");
  await pagina.getByRole("button",{name:"Confirmar inscripción"}).click();
  await pagina.locator(".ticket-codigo").waitFor();
  const codigo = (await pagina.locator(".ticket-codigo").textContent()).trim();
  assert.match(codigo,/^EVQR-/);
  await capturar("03-ticket-pendiente-postgresql");

  const antes = await pagina.request.get(api+"/api/eventos?estado=publicado");
  const todos = await antes.json();
  const evento = todos.find(e=>e.nombre.includes("Capacitación en Git"));
  assert(evento && evento.inscritos>=1,"La inscripción debe persistir en PostgreSQL");

  await pagina.getByRole("button",{name:"Pagar y emitir comprobante"}).click();
  await pagina.getByText("COMPROBANTE DE PAGO").waitFor();
  await pagina.locator(".ticket-codigo").waitFor();
  await capturar("04-comprobante-pago-simulado-postgresql");

  await pagina.getByRole("button",{name:"Organizador"}).click();
  await pagina.getByRole("heading",{name:"Acceso del organizador"}).waitFor();
  await capturar("05-login-restringido");
  await pagina.locator("#login-email").fill("ingenieria@uandresbello.edu");
  await pagina.locator("#login-clave").fill("ClavePruebaSoloCI-12345");
  await pagina.getByRole("button",{name:"Ingresar",exact:true}).click();
  await pagina.getByRole("heading",{name:"Panel del organizador"}).waitFor();
  await pagina.locator("table tbody tr").first().waitFor();
  await capturar("06-panel-organizador-autenticado");

  await pagina.getByRole("button",{name:"Acreditación"}).click();
  await pagina.locator("#codigo-acreditacion").fill(codigo);
  await pagina.getByRole("button",{name:"Acreditar",exact:true}).click();
  await pagina.getByText(/Asistencia de .* registrada correctamente/i).waitFor();
  await capturar("07-acreditacion-registrada");

  await pagina.locator("#codigo-acreditacion").fill(codigo);
  await pagina.getByRole("button",{name:"Acreditar",exact:true}).click();
  await pagina.getByText(/ya registró su asistencia a este evento/i).waitFor();
  await capturar("08-intento-duplicado");

  await pagina.getByRole("button",{name:"Dashboard"}).click();
  await pagina.getByRole("heading",{name:"Dashboard de aforo"}).waitFor();
  await pagina.locator(".stub-aforo-numero").first().waitFor();
  await capturar("09-dashboard-postgresql");

  await pagina.getByRole("button",{name:"Bitácora"}).click();
  await pagina.getByRole("heading",{name:"Bitácora de accesos"}).waitFor();
  await pagina.locator("table tbody tr").first().waitFor();
  await capturar("10-bitacora-mongodb");
  const bitacora=await pagina.request.get(api+"/api/registros-acceso",{
     headers:{"Authorization":"Bearer "+await pagina.evaluate(()=>sessionStorage.getItem("acreditaqr-token"))}
  });
  assert.equal(bitacora.status(),200);
  const registros=await bitacora.json();
  assert(registros.some(x=>x.codigo===codigo && x.resultado==="acreditado"),"Mongo debe registrar acreditación");
  assert(registros.some(x=>x.codigo===codigo && x.resultado==="duplicado"),"Mongo debe registrar duplicado");

  const sw=await contexto.newPage();
  const respSwagger=await sw.goto(api+"/docs",{waitUntil:"networkidle"});
  assert.equal(respSwagger.status(),200);
  await sw.getByText("AcreditaQR API").first().waitFor();
  await sw.screenshot({path: pruebas+"/11-swagger-fastapi-docker.png",fullPage:false});
  await sw.close();

  await pagina.setViewportSize({width:390,height:844});
  await pagina.getByRole("button",{name:"Eventos",exact:true}).click();
  await pagina.locator(".card-evento").first().waitFor();
  await capturar("12-responsive-movil-docker");

  assert.deepEqual(errores,[]);
  console.log("DOCKER E2E OK: React, login, SQL inscripción/pago, MongoDB acreditación/doble intento, Swagger y móvil.");
} finally {await navegador.close();}
