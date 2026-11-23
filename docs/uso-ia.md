# Uso de Inteligencia Artificial — Hito 3

> **Responde al punto 10 del enunciado.**
>
> Antes de entregar: revisa cada fila, corrige lo que no corresponda y completa
> lo marcado como **(completar)**. Este documento es tu respaldo en la defensa,
> y el enunciado advierte que puede haber preguntas sobre el código asistido
> por IA.

## Declaración general

El Hito 3 se desarrolló con apoyo intensivo de IA. El backend FastAPI, la
integración con PostgreSQL y MongoDB, el `docker-compose.yml` y la capa de
servicios del frontend fueron generados con asistencia de **Claude
(Anthropic)**, en una sesión de trabajo conducida por el equipo.

Lo que aportó el equipo: las decisiones de alcance y arquitectura, la
configuración del entorno, la verificación de que todo funciona en la máquina
real, el flujo de Git y la resolución de los problemas que aparecieron durante
la instalación y la ejecución.

No se presenta como trabajo propio el código generado. Se presenta como
trabajo revisado, ejecutado y comprendido por el equipo.

## Herramientas

| Herramienta | Integrante | Etapa |
|---|---|---|
| Claude (Anthropic) | Benjamin Michea | Diagnóstico, backend, persistencia, frontend, documentación |
| *(completar)* | Cristian Pérez | *(completar)* |
| *(completar)* | Ignacio Cornejo | *(completar)* |

---

## Registro de uso

### 1. Diagnóstico del Taller 2 y definición del alcance

**Propósito:** análisis y diseño.

**Prompt representativo:** *"debo continuar con la entrega del taller 3 y estas
son las instrucciones"* — acompañado del enunciado del Hito 3 y del enlace al
repositorio.

**Resultado:** la herramienta clonó el repositorio público, revisó el estado
del Taller 2 y señaló que el caso 3.6 exige seis funcionalidades de las cuales
tres ya estaban implementadas en React (inscripciones, control de cupos,
estados de asistente) y tres faltaban (organizadores, publicación de eventos,
pagos con comprobante). Propuso además usar el log de acreditación QR como la
colección de MongoDB, por corresponder a "registros de acceso y participación".

**Validación humana:** se contrastó la propuesta con el punto 3.6 del enunciado
para confirmar que cubría las seis funcionalidades obligatorias.

**Aprendizaje:** la elección de la base NoSQL no es una decisión técnica
aislada: tiene que responder a una característica real de los datos. En este
caso, que los registros de acceso son hechos históricos de sólo inserción, con
forma variable según el resultado.

---

### 2. Instalación de Docker y WSL2

**Propósito:** configuración del entorno.

**Prompt representativo:** *"no tengo Docker instalado, ¿qué deberia hacer?"*

**Resultado:** indicaciones para instalar WSL2 con `wsl --install`, reiniciar,
instalar Docker Desktop y verificar con `docker ps`.

**Validación humana:** se ejecutaron los pasos y se comprobó que el motor
quedara en "Engine running". Apareció un error intermedio: `docker --version`
respondía pero `docker ps` fallaba con *"cannot connect to the docker API at
npipe:////./pipe/docker_engine"*. Se resolvió al entender que el cliente de
línea de comandos y el motor son dos cosas distintas, y que el motor sólo
arranca al abrir la aplicación Docker Desktop.

**Aprendizaje:** la diferencia entre el cliente Docker y el demonio; y que WSL2
es un requisito previo en Windows, no parte del instalador.

---

### 3. Backend FastAPI con separación de responsabilidades

**Propósito:** generación de código.

**Prompt representativo:** solicitud de un backend FastAPI para el caso 3.6 con
PostgreSQL y MongoDB, separando controladores, servicios, esquemas, modelos y
configuración, con reglas de negocio demostrables y Swagger.

**Resultado:** backend organizado en `core/`, `models/`, `schemas/`,
`services/` y `routers/`, con 29 endpoints, errores de dominio traducidos a
HTTP por un manejador central, y 15 pruebas automatizadas que la herramienta ejecutó contra PostgreSQL real
antes de entregarlo. En el cierre de la rama feature/realtime se añadió una
prueba de integración WebSocket, por lo que la suite actual contiene 16 pruebas.

**Validación humana:** se levantó con Docker Compose en la máquina del equipo,
se cargaron los datos de prueba y se recorrió el flujo completo desde Swagger:
crear evento, publicar, inscribir, pagar, acreditar y acreditar de nuevo.
*(completar: qué más revisaron, qué ajustaron)*

**Aprendizaje:** por qué los servicios no deben conocer HTTP. Al lanzar
excepciones de dominio en vez de `HTTPException`, la misma lógica sirve para la
API web y para cualquier otro cliente, y todos los errores salen con la misma
forma sin repetir código en cada endpoint.

---

### 4. Corrección de un error en la conversión a DTO

**Propósito:** depuración.

**Resultado:** al ejecutar las pruebas, ocho fallaron con
`ValidationError: categoria — Input should be a valid string`. La causa: el DTO
`EventoSalida` define `categoria` como texto, pero `model_validate` sobre el
objeto de SQLAlchemy leía la relación completa en vez del nombre. Se corrigió
copiando sólo las columnas de la tabla y agregando después los campos
derivados.

**Validación humana:** se volvieron a ejecutar las 15 pruebas, todas en verde.

**Aprendizaje:** `from_attributes` de Pydantic lee los atributos del objeto sin
distinguir entre columnas y relaciones. Cuando un campo del DTO se llama igual
que una relación del modelo pero tiene otro tipo, hay que construir el
diccionario explícitamente.

---

### 5. Justificación del uso de MongoDB

**Propósito:** diseño y documentación.

**Resultado:** cuatro argumentos sobre por qué los registros de acceso no son
una duplicación de PostgreSQL: son hechos y no estado, son de sólo inserción,
crecen a otra escala y su forma varía según el resultado del intento. Se
implementó además un resumen por evento con el pipeline de agregación
(`$match` + `$group`) en lugar de contar en Python.

**Validación humana:** se verificó en la aplicación que los tres tipos de
intento (acreditado, duplicado, código inválido) quedan registrados con
estructura distinta. *(completar)*

**Aprendizaje:** el enunciado advierte que no basta con conectar MongoDB. La
prueba de que su uso está justificado es poder señalar una característica de
los datos que una tabla relacional modelaría peor.

---

### 6. Migración del frontend a la API

**Propósito:** generación de código y refactorización.

**Resultado:** capa de servicios HTTP (`apiCliente.js` y un módulo por
recurso), hook `useRecurso` para los estados de carga y error, y componentes
nuevos para administración de eventos, pago con comprobante y bitácora de
accesos. Se eliminaron `data/eventos.json`, `services/climaApi.js` y
`utils/inscripciones.js`.

**Validación humana:** se recorrió el flujo completo en el navegador con el
backend levantado. *(completar: qué revisaron, qué ajustaron)*

**Aprendizaje:** tres decisiones del Taller 2 eran incorrectas y se entendió
por qué: generar el código de acreditación con `Math.random()` en el navegador
(el código es la credencial de acceso y debe emitirlo el servidor); validar el
aforo sólo en el cliente (el navegador es manipulable y el aforo cambia
mientras el formulario está abierto); y guardar el estado completo en
`localStorage` en lugar de una referencia.

---

## Qué puede explicar el equipo

*(Completar honestamente antes de la entrega. Si hay partes que no se dominan,
es mejor estudiarlas que declararlas.)*

| Área | Quién la explica |
|---|---|
| Modelo relacional y restricciones | *(completar)* |
| Reglas de negocio y códigos HTTP | *(completar)* |
| Justificación de MongoDB y la agregación | *(completar)* |
| Capa de servicios del frontend y estados | *(completar)* |
| Docker Compose y variables de entorno | *(completar)* |
| Integración de la API pública | *(completar)* |


---

### 7. Cierre técnico de la rama feature/realtime con ChatGPT

**Herramienta:** ChatGPT (OpenAI), modelo GPT-6 en esta sesión.

**Propósito:** revisión de calidad, depuración, integración en tiempo real y mejora del flujo de acreditación.

**Solicitud representativa:** *"Quiero que dejes terminado el trabajo ahora en la rama que creamos"*, con la condición previa de trabajar exclusivamente en `feature/realtime` y no modificar `master` ni `backup/pre-realtime`.

**Cambios realizados con asistencia de IA:**
- Se garantizó la limpieza de conexiones WebSocket en el bloque `finally` del endpoint.
- Se agregó una prueba que crea un evento mediante REST y comprueba la notificación recibida por WebSocket.
- Se incorporó GitHub Actions para ejecutar pruebas de backend y validaciones de frontend.
- Se corrigieron errores de ESLint detectados por la ejecución automatizada.
- Se incorporó lectura de QR con cámara mediante `BarcodeDetector`, con ingreso manual como alternativa cuando el navegador no ofrece esa API.

**Validación automatizada observada:** en el commit `6043bdb`, GitHub Actions informó éxito para el trabajo de backend (instalación, seed y 16 pruebas) y para el trabajo de frontend (instalación, ESLint y build). Esa ejecución antecede al último cambio de escáner de cámara; la ejecución de CI del commit posterior debe revisarse antes de declarar todo validado.

**Validación humana pendiente:** el equipo debe revisar el código, probar el escáner en el dispositivo real, recorrer el flujo completo en navegador y completar las evidencias. Esta herramienta no realizó la prueba física de cámara ni la presentación oral.

**Aprendizaje a preparar para la defensa:** un WebSocket informa que algo cambió, pero REST sigue entregando los datos actuales; el gestor en memoria sirve para una sola instancia, y una instalación con múltiples workers necesita un mecanismo compartido como Redis Pub/Sub. El escáner QR depende de las capacidades del navegador y de permiso de cámara, por lo que debe conservarse una alternativa manual.

## Qué puede explicar el equipo

*(Completar honestamente antes de la entrega. Si hay partes que no se dominan, es mejor estudiarlas que declararlas.)*

---

## Revisión de rúbrica y correcciones asistidas — 9 de noviembre de 2026

- **Herramienta:** ChatGPT (GPT-6), acceso autorizado a GitHub por conector.
- **Propósito y prompt:** el usuario solicitó revisar el repositorio frente a la rúbrica unificada del Hito 3 y corregir deficiencias detectadas.
- **Resultado propuesto:** bloqueo transaccional de eventos durante inscripción y cambios de aforo, Dockerfile con pruebas disponibles, instalación reproducible de dependencias del frontend, prueba optativa contra MongoDB real y workflow de CI para React/API/SQL/NoSQL.
- **Validación técnica:** revisión estática del contenido y coherencia entre archivos. El resultado de GitHub Actions debe consultarse después de ejecutarse; no se afirma aquí que las pruebas hayan pasado.
- **Validación humana y aprendizaje:** **pendiente de completar por el equipo**, tras revisar la PR, levantar los contenedores, reproducir los flujos reales y explicar por qué `SELECT FOR UPDATE` evita la carrera por el último cupo. No declarar esta verificación como realizada hasta ejecutarla.

## Nueva revisión asistida de GitHub Pages, seguridad y validaciones — noviembre 2026

**Herramienta:** ChatGPT (GPT-6), conectado a GitHub con autorización para crear y modificar archivos, ramas y pull requests.

**Solicitud representativa:** «quiero que realices todo eso y dejes la pagina funcionando en github pages», tras revisar la rúbrica del Hito 3 y las brechas sobre autenticación, demostración, pruebas y despliegue.

**Cambios producidos:** autenticación organizador con contraseña PBKDF2 y token HMAC, controles de rol por endpoint, prueba de posesión del código para entradas privadas, formulario de login React, separación clara entre API real y demo autónoma para Pages, workflow de despliegue desde master, flujo de prueba de navegador con Playwright y actualización de documentación de limitaciones.

**Validación automatizada:** el workflow `hito3-ci.yml` verifica compilación de React, pruebas API, PostgreSQL y MongoDB. El workflow `evidencia-pages.yml` comprueba interacciones en Chromium con datos ficticios y produce capturas reales de esa demostración. Se debe consultar el resultado de cada ejecución; no atribuir a ninguna prueba una ejecución que no haya pasado.

**Validación humana:** queda a cargo del equipo probar la versión real desde navegador, revisar los logs, explicar cada cambio y dejar constancia de los resultados. La herramienta no ha validado por los integrantes ni debe sustituir la defensa individual.

**Aprendizaje técnico:** un sitio de GitHub Pages no puede alojar FastAPI ni las bases de datos. Por eso la demo estática se marca como tal; para una web Full Stack pública se requiere una API externa HTTPS y sus bases persistentes, con CORS y secretos configurados.

---

# Uso de Inteligencia Artificial — Hito 4 (aplicación móvil)

**Fecha:** 23 de noviembre de 2026
**Herramienta:** Claude (Anthropic), modelo Opus 5
**Integrante que condujo la sesión:** Benjamin Michea

## Declaración

La pantalla "Mis entradas" de la aplicación móvil y el cambio asociado en el
backend se desarrollaron con asistencia de IA, en una sesión conducida por el
integrante. El código generado está identificado en el historial de Git: los
commits `a510b37`, `9fbe74a` y `0e8dedb` llevan la línea
`Co-Authored-By: Claude Opus 5`, y se integraron mediante el Pull Request #22
hacia la rama `mobile`.

No se presenta como trabajo propio el código generado. Se presenta como código
revisado, ejecutado y comprendido por el integrante.

## Registro de uso

### 1. Revisión del estado de la aplicación frente al enunciado

**Propósito:** diagnóstico.

**Solicitud representativa:** *"debo de continuar con la página web, ya es el
último taller por lo tanto es la entrega final"*, acompañada del enunciado del
Hito 4 y del enlace al repositorio.

**Resultado:** la herramienta revisó la rama `mobile` y comparó lo
implementado con los flujos exigidos. Concluyó que estaban cubiertos el
catálogo con inscripción y el escaneo con acreditación, pero faltaba el tercero:
que el asistente pudiera volver a consultar su inscripción y su comprobante
después de cerrar la aplicación.

**Validación humana:** se contrastó con el enunciado del Hito 4 y se recorrió la
aplicación para confirmar que, efectivamente, al cerrar la app se perdía el
acceso al QR.

---

### 2. Reconstrucción del entorno de desarrollo en otro equipo

**Propósito:** configuración del entorno.

**Resultado:** instalación de WSL2 y Docker Desktop, clonado del repositorio,
creación del archivo `.env` a partir de `.env.example`, levantado del stack con
`docker compose up -d --build`, carga de datos de prueba y creación de las
credenciales de organizador con `app.configurar_organizador`.

**Problemas resueltos durante el proceso:**

- Docker Desktop no arrancaba por faltar la característica *Virtual Machine
  Platform* de Windows. Se habilitó con `Enable-WindowsOptionalFeature` y un
  reinicio completo.
- PowerShell bloqueaba `npm.ps1` por política de ejecución. Se resolvió usando
  `npm.cmd`.
- La aplicación móvil no conectaba con el backend. La causa era que Expo había
  arrancado en el puerto 8082 porque el 8081 estaba ocupado por una instancia
  anterior, y ese origen no estaba autorizado en `CORS_ORIGENES`.

**Aprendizaje:** el error *"No se pudo conectar con Acredita QR"* no distingue
entre un backend caído y una petición rechazada por CORS, porque el navegador
no entrega el detalle al código JavaScript por razones de seguridad. Hay que
mirar el puerto real y la lista de orígenes permitidos.

---

### 3. Pantalla "Mis entradas" y cambio en el backend

**Propósito:** generación de código.

**Solicitud:** implementar el flujo faltante, respetando el diseño existente y
sin duplicar estado en el dispositivo.

**Resultado:**

- `backend/app/schemas/inscripcion.py` y `backend/app/routers/inscripciones.py`:
  el detalle de una inscripción ahora expone `pago_id` y `numero_comprobante`.
  Sin el identificador del pago, la aplicación no tenía cómo solicitar el
  comprobante.
- `mobile/src/services/almacenamiento.js` (nuevo): guarda en el dispositivo
  únicamente el `id` y el `codigo` de cada inscripción, con un máximo de 20
  entradas por el límite de tamaño de `expo-secure-store`.
- `mobile/src/services/api.js`: función `comprobante()`, que envía el código en
  la cabecera `X-Codigo-Entrada`.
- `mobile/src/screens/MyTicketsScreen.js` (nuevo): la pantalla.
- `mobile/App.js` y `mobile/src/screens/EventsScreen.js`: pestaña "Entradas" en
  la navegación y guardado automático de la referencia al inscribirse.

**Decisión de diseño discutida:** no guardar la entrada completa en el
dispositivo, sino sólo una referencia, para que el estado se consulte siempre al
backend. Si se guardara la entrada completa, el teléfono seguiría mostrando
"confirmada" después de que el organizador acreditara la asistencia.

**Limitación declarada por la herramienta:** la herramienta verificó la sintaxis
de los archivos generados con `@babel/parser` y `py_compile`, pero **no pudo
ejecutar la aplicación**: no tenía Docker ni Expo disponibles en su entorno. Lo
dejó explícito al entregar el código.

**Validación humana:** el integrante reconstruyó el backend, levantó Expo y
recorrió el flujo completo en el navegador: inscripción en el "Taller de Diseño
de Redes", pago, aparición de la entrada en la pestaña "Entradas" con su estado
y su QR, y despliegue del comprobante `CMP-2026-000001` por $8.000. El contador
del evento pasó de 20 a 19 cupos disponibles, confirmando que el dato se
persistió en PostgreSQL.

**Aprendizaje para la defensa:** el asistente no tiene cuenta en el sistema, se
identifica por posesión del código de su entrada. Esa es la razón por la que
los endpoints de inscripción y comprobante exigen la cabecera
`X-Codigo-Entrada` en lugar de un token: no hay usuario que autenticar, pero sí
hay que demostrar que se posee la entrada.

---

### 4. Documentación del Hito 4

**Propósito:** documentación.

**Resultado:** el archivo `docs/hito4-mobile.md`, con las pantallas y sus
flujos, la lista de endpoints consumidos, la configuración de la URL del
servidor y las limitaciones conocidas. La lista de endpoints se obtuvo leyendo
los routers reales del backend, no de memoria.

**Validación humana:** *(completar: revisar que cada endpoint listado
corresponda a lo que la app efectivamente llama, y que las capturas coincidan
con las pantallas descritas)*

---

## Qué puede explicar el integrante sobre el Hito 4

| Tema | Explicación preparada |
|---|---|
| Por qué el dispositivo guarda referencias y no datos | Sí — el estado cambia fuera del teléfono |
| Por qué el código lo emite el servidor y no la app | Sí — es la credencial de acceso |
| Para qué sirve la cabecera `X-Codigo-Entrada` | Sí — prueba de posesión sin cuenta de usuario |
| Qué hace el WebSocket y qué no hace | Sí — avisa que algo cambió; los datos siguen llegando por REST |
| Cómo se configura la URL del servidor | Sí — `EXPO_PUBLIC_API_URL`, leída al compilar el bundle |
| Por qué el escáner tiene alternativa manual | Sí — el permiso de cámara puede denegarse |
