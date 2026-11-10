# AcreditaQR — Plataforma Web Full Stack

**Hito 3 · Desarrollo Web y Móvil · Segundo Semestre 2026**
Universidad Andrés Bello

Gestión de eventos y acreditación de asistentes mediante código QR.

## Integrantes

- Benjamin Michea
- Cristian Pérez
- Ignacio Cornejo

---

## 1. Problema y usuarios objetivo

Los seminarios, capacitaciones y ferias universitarias gestionan sus
inscripciones y su control de asistencia de forma manual, con planillas o
listas en papel. Eso hace difícil controlar el aforo, saber cuántos cupos
quedan, verificar quién asistió realmente y dejar evidencia de lo ocurrido en
la puerta.

| Usuario | Qué necesita |
|---|---|
| **Asistente** | Encontrar eventos con cupo, inscribirse, pagar cuando corresponda y tener su entrada a mano |
| **Organizador** | Publicar y administrar sus eventos, acreditar asistentes en la puerta y ver el aforo en tiempo real |

---

## 2. Continuidad con el Taller 2

El caso, el dominio y los usuarios son los mismos del Taller Evaluado 2. Lo que
cambió es dónde viven los datos y quién aplica las reglas.

### Qué se conserva

- La problemática, los usuarios y los flujos principales.
- La identidad visual completa: paleta, tipografías y el motivo de "talón de
  entrada" definidos en el diseño previo.
- Los componentes de presentación (`EventoCard`, `Ticket`, `DetalleEvento`,
  `Navbar`) y la estructura de navegación.
- La aplicación React, que sigue en `taller2-react/`.

### Qué se modificó

| Taller 2 | Hito 3 |
|---|---|
| Eventos en `src/data/eventos.json` | Tabla `eventos` en PostgreSQL |
| Inscripciones en un array de React | Tabla `inscripciones` en PostgreSQL |
| Aforo calculado en el navegador | Consulta agregada en el backend |
| Código de entrada generado con `Math.random()` | Generado en el servidor con `secrets.token_hex` |
| Validación de aforo y duplicados en el cliente | Reglas de negocio en el backend, con restricciones en la base |
| Open-Meteo llamado desde el navegador | Llamado desde el backend, que conoce el evento |
| Estado completo en `localStorage` | Sólo el id y código privado de la última entrada, para recuperarla de forma controlada |

Tres decisiones merecen explicación:

**El código de acreditación.** `Math.random()` no es criptográficamente seguro
y el código es la credencial que permite entrar al evento. Generarlo en el
navegador significaba además que el cliente decidía su propia entrada. Ahora lo
emite el servidor.

**Las reglas de aforo y duplicados.** Validarlas sólo en el cliente no sirve:
el navegador es manipulable y el aforo cambia mientras el formulario está
abierto. Ahora se validan en el backend, y además la tabla `inscripciones`
tiene una restricción `UNIQUE (evento_id, usuario_id)` como última barrera.

**La API pública.** Movida al backend porque es quien conoce las coordenadas y
la fecha del evento, porque centraliza el manejo de errores en un solo lugar, y
porque el cliente móvil del Hito 4 la reutilizará sin reescribirla.

### Qué se amplió

Las funcionalidades obligatorias del caso 3.6:

- **Organizadores y perfiles** — un usuario puede tener perfil de organizador.
- **Creación, edición y publicación de eventos** — ciclo completo, con estados
  borrador, publicado y cancelado.
- **Categorías, fechas, ubicaciones y capacidad** — administrables desde la API.
- **Inscripciones y control de cupos** — con las reglas de negocio aplicadas.
- **Asistentes y estados de inscripción** — pendiente de pago, confirmada,
  acreditada y cancelada.
- **Pagos simulados, comprobantes e indicadores** — pago simulado que emite un
  comprobante correlativo y habilita la acreditación.

---

## 3. Arquitectura

```
                    ┌──────────────────────┐
                    │   React (Vite)       │
                    │   puerto 5173        │
                    └──────────┬───────────┘
                               │ HTTP / JSON
                    ┌──────────▼───────────┐
                    │  FastAPI             │
                    │  API REST + Swagger  │──── HTTPS ──▶ Open-Meteo
                    │  puerto 8000         │               (API pública)
                    └────┬────────────┬────┘
                         │            │
              ┌──────────▼───┐   ┌────▼──────────┐
              │ PostgreSQL   │   │ MongoDB       │
              │ puerto 5432  │   │ puerto 27017  │
              │ estado       │   │ bitácora      │
              └──────────────┘   └───────────────┘
```

| Componente | Responsabilidad |
|---|---|
| React | Interfaz, navegación, formularios, estados de carga y error |
| FastAPI | Reglas de negocio, validación, coordinación de ambas persistencias |
| PostgreSQL | Información relacional y transaccional del dominio |
| MongoDB | Bitácora de accesos: hechos históricos de volumen creciente |
| Swagger | Contrato y documentación interactiva de la API |
| Docker Compose | Ejecución reproducible de los cuatro servicios |

### Organización del backend

```
backend/app/
├── core/        configuración, conexiones y errores de dominio
├── models/      modelos SQLAlchemy (PostgreSQL)
├── schemas/     DTO de entrada y salida (Pydantic)
├── services/    reglas de negocio — no conocen HTTP
├── routers/     endpoints — no conocen SQL
├── seed.py      datos de prueba reproducibles
└── main.py      montaje, CORS y manejo de errores
```

Los servicios lanzan excepciones de dominio (`NoEncontrado`, `Conflicto`,
`ReglaNegocio`, `ServicioExterno`) y un manejador en `main.py` las traduce a
respuestas HTTP. Así la lógica de negocio es independiente del framework y
todos los errores salen con la misma forma.

### Organización del frontend

```
taller2-react/src/
├── services/    cliente HTTP y funciones por recurso
├── hooks/       useRecurso: carga, error y recarga
├── components/  presentación
├── pages/       composición de cada vista
└── utils/       formato y etiquetas
```

---

## 4. Tecnologías y versiones

| Componente | Tecnología | Versión |
|---|---|---|
| Frontend | React | 19.2 |
| | Vite | 8.3 |
| | Bootstrap | 5.3 |
| | qrcode.react | 4.2 |
| Backend | Python | 3.12 |
| | FastAPI | 0.115 |
| | SQLAlchemy | 2.0 |
| | Pydantic | 2.10 |
| | psycopg | 3.2 |
| | PyMongo | 4.10 |
| Bases de datos | PostgreSQL | 16 (alpine) |
| | MongoDB | 7 |
| Infraestructura | Docker Compose | — |

---

## 5. Modelo de datos

### PostgreSQL — modelo relacional

```
usuario 1 ──── 0..1 organizador
organizador 1 ──── N evento
categoria   1 ──── N evento
evento      1 ──── N inscripcion
usuario     1 ──── N inscripcion
inscripcion 1 ──── 0..1 pago
```

| Tabla | Campos principales | Restricciones |
|---|---|---|
| `usuarios` | nombre, email, telefono, rol | `email` único |
| `organizadores` | usuario_id, nombre_organizacion | `usuario_id` único, FK a usuarios |
| `categorias` | nombre | `nombre` único |
| `eventos` | organizador_id, categoria_id, nombre, fecha, lugar, coordenadas, aforo_max, precio, estado | FK a organizadores y categorías |
| `inscripciones` | evento_id, usuario_id, codigo, estado | `UNIQUE (evento_id, usuario_id)`, `codigo` único |
| `pagos` | inscripcion_id, monto, metodo, estado, numero_comprobante | `inscripcion_id` único, `numero_comprobante` único |

**Dato derivado, no almacenado.** El número de inscritos no existe como
columna: se calcula contando las inscripciones que ocupan cupo. Esto corrige un
problema real del Taller 2, donde un contador `aforoActual` convivía con la
lista de inscripciones y ambos podían contradecirse. Con una sola fuente de
verdad, el listado y el dashboard no pueden mostrar números distintos.

### MongoDB — por qué, y por qué no es duplicación

La colección es **`registros_acceso`**: un documento por cada intento de
acreditación en la puerta, haya resultado exitoso o rechazado.

```json
{
  "codigo": "EVQR-A3F2B1C4-9D8E7F",
  "resultado": "duplicado",
  "puerta": "principal",
  "evento_id": 4,
  "inscripcion_id": 17,
  "ocurrido_en": "2026-11-08T22:31:05.412Z",
  "detalle": {
    "asistente": "Camila Fuentes",
    "acreditada_originalmente_en": "2026-11-08T22:28:44.001Z"
  }
}
```

Cuatro razones por las que estos datos no son una copia de PostgreSQL:

1. **Son hechos, no estado.** PostgreSQL guarda que la inscripción 17 está
   acreditada. MongoDB guarda que alguien presentó ese código tres veces, a qué
   hora y en qué puerta. La inscripción puede cambiar después; el registro de
   lo que pasó a las 22:31 no.
2. **Son sólo de inserción.** Nunca se actualizan ni se borran. No necesitan
   transacciones ni integridad referencial, que es lo que aporta una base
   relacional.
3. **Crecen a otra escala.** Un evento de 150 personas genera 150 filas en
   `inscripciones` y puede generar 400 documentos de acceso entre reintentos,
   códigos erróneos y entradas ya usadas.
4. **Su forma varía según el caso.** Un acceso denegado por código inválido no
   tiene asistente ni evento. Uno rechazado por pago guarda el monto pendiente.
   Uno duplicado guarda cuándo se acreditó originalmente. En una tabla
   relacional eso obliga a columnas nulas o a varias tablas para un mismo
   hecho; en un documento, cada registro lleva lo que le corresponde.

**Dónde se usa.** El servicio de acreditación escribe en cada intento. El panel
del organizador tiene una pestaña de bitácora que lee la colección y muestra un
resumen por evento calculado con el *pipeline* de agregación de MongoDB
(`$match` + `$group`).

---

## 6. API REST

Documentación interactiva: **http://localhost:8000/docs**
Esquema OpenAPI: **http://localhost:8000/openapi.json**

La documentación la genera FastAPI a partir de los esquemas Pydantic, de modo
que no puede quedar desalineada de lo que la API acepta y devuelve.

### Endpoints

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/salud` | Estado del servicio |
| GET/POST | `/api/usuarios` | Listar y registrar usuarios |
| GET | `/api/usuarios/{id}` | Obtener un usuario |
| GET/POST | `/api/organizadores` | Listar y crear perfiles de organizador |
| GET/POST | `/api/categorias` | Listar y crear categorías |
| GET | `/api/eventos` | Listar con filtros de texto, categoría, estado y organizador |
| POST | `/api/eventos` | Crear evento (nace en borrador) |
| GET/PUT/DELETE | `/api/eventos/{id}` | Obtener, actualizar y eliminar |
| POST | `/api/eventos/{id}/publicar` | Habilitar inscripciones |
| POST | `/api/eventos/{id}/cancelar` | Cancelar evento e inscripciones |
| GET | `/api/eventos/{id}/clima` | Pronóstico desde la API pública |
| GET | `/api/inscripciones` | Listar con filtros |
| POST | `/api/inscripciones` | Inscribir a un usuario existente |
| POST | `/api/inscripciones/publica` | Inscripción desde el formulario del sitio |
| GET | `/api/inscripciones/{id}` | Detalle con evento y asistente |
| GET | `/api/inscripciones/codigo/{codigo}` | Buscar entrada sin acreditarla |
| POST | `/api/inscripciones/{id}/cancelar` | Cancelar y liberar el cupo |
| GET/POST | `/api/pagos` | Listar y registrar pagos simulados |
| GET | `/api/pagos/{id}/comprobante` | Comprobante del pago |
| POST | `/api/acreditaciones` | Acreditar en la puerta |
| GET | `/api/registros-acceso` | Bitácora desde MongoDB |
| GET | `/api/eventos/{id}/participacion` | Resumen agregado en MongoDB |
| GET | `/api/indicadores` | Indicadores de aforo y recaudación |

### Reglas de negocio y códigos de respuesta

| Regla | Respuesta | Código |
|---|---|---|
| Persona ya inscrita en el evento | 409 | `inscripcion_duplicada` |
| Aforo completo | 409 | `aforo_completo` |
| Reducir el aforo bajo los inscritos | 409 | `aforo_menor_que_inscritos` |
| Eliminar un evento con inscritos | 409 | `evento_con_inscritos` |
| Inscribirse en un evento no publicado | 422 | `evento_no_publicado` |
| Publicar un evento sin descripción | 422 | `descripcion_requerida` |
| Cancelar una inscripción ya acreditada | 422 | `inscripcion_acreditada` |
| Recurso inexistente | 404 | `no_encontrado` |
| Datos con formato inválido | 422 | validación de Pydantic |
| API pública caída o lenta | 503 | `clima_no_disponible` |

Los errores responden siempre `{ "codigo": "...", "mensaje": "..." }`. Nunca se
exponen trazas, consultas ni credenciales: los fallos inesperados quedan en el
log del servidor y el cliente recibe un mensaje genérico.

**Caso especial: la acreditación responde 200 incluso cuando rechaza.** El
resultado viaja en el campo `resultado` (`acreditado`, `duplicado`,
`codigo_invalido`, `sin_pago`, `cancelada`, `evento_no_publicado`). Un código
inválido en la puerta no es un error del sistema sino información operativa que
el organizador necesita y que debe quedar registrada.

---

## 7. API pública

| Elemento | Detalle |
|---|---|
| Nombre | Open-Meteo |
| Documentación | https://open-meteo.com/en/docs |
| Endpoint | `GET https://api.open-meteo.com/v1/forecast` |
| Parámetros | `latitude`, `longitude`, `daily`, `timezone`, `start_date`, `end_date` |
| Datos consumidos | temperatura máxima y mínima, código WMO del día |
| Autenticación | No requiere clave |
| Integración | Desde el **backend** (`app/services/clima_service.py`) |
| Dónde se muestra | Detalle del evento y modal de inscripción |

**Se mantuvo la del Taller 2 pero se movió al backend.** Tres razones: el
backend ya conoce las coordenadas y la fecha del evento, así que el frontend
sólo pide `/eventos/{id}/clima`; la traducción de códigos WMO y el manejo de
fallos quedan en un solo lugar; y el cliente móvil del Hito 4 lo reutiliza sin
reescribirlo. Si algún día la API requiriera clave, viviría en el servidor como
variable de entorno.

**Aporte al problema.** Varios eventos del dominio son al aire libre (ferias,
jornadas deportivas). El pronóstico del día influye en la decisión de asistir y
en cómo prepararse.

**Manejo de errores.** El componente contempla cuatro estados: cargando, error
(con el formulario igualmente utilizable), sin datos —el pronóstico cubre unos
16 días, así que un evento lejano no tiene información todavía— y datos
disponibles. Un fallo del servicio externo nunca impide inscribirse.

---

## 8. Ejecución

### Requisitos

- Docker Desktop (con WSL2 en Windows)
- Git

### Puesta en marcha

```bash
git clone https://github.com/crisito27/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR.git
cd Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR

# Windows PowerShell
Copy-Item .env.example .env
# Linux / macOS
cp .env.example .env

docker compose up --build
```

Con los servicios arriba, cargar los datos de prueba:

```bash
docker compose exec backend python -m app.seed
```

### Servicios

| Servicio | URL | Descripción |
|---|---|---|
| Frontend | http://localhost:5173 | Aplicación React |
| API | http://localhost:8000 | Backend FastAPI |
| Swagger | http://localhost:8000/docs | Documentación interactiva |
| PostgreSQL | localhost:5432 | Base relacional |
| MongoDB | localhost:27017 | Base documental |

El backend espera a que ambas bases estén `healthy` antes de arrancar
(`depends_on` con `condition: service_healthy`), de modo que no hay que
ordenar el arranque a mano.

### Variables de entorno

Se definen en `.env`, que **no se versiona**. El repositorio incluye
`.env.example` con los valores de ejemplo.

| Variable | Descripción |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL |
| `POSTGRES_PORT_HOST` | Puerto publicado en el host |
| `MONGO_DB` / `MONGO_PORT_HOST` | Base y puerto de MongoDB |
| `BACKEND_PORT` / `FRONTEND_PORT` | Puertos de los servicios |
| `CORS_ORIGENES` | Orígenes autorizados, separados por coma |
| `DEBUG` | Registro detallado de SQL |

### Inicialización de datos

Las tablas se crean al arrancar la API desde los modelos de SQLAlchemy. El
script `app/seed.py` carga datos de prueba y es **idempotente**: puede
ejecutarse las veces que haga falta sin duplicar nada. Las fechas de los
eventos se calculan a partir del día de ejecución, de modo que siempre caen
dentro del rango de pronóstico de Open-Meteo.

Carga 4 categorías, 3 organizadores, 3 asistentes y 6 eventos, uno de ellos en
borrador y sin descripción, para poder demostrar la validación al publicar.

---

## 9. Pruebas

```bash
docker compose exec backend python -m pytest tests/ -v
```

20 pruebas de API, concurrencia, autenticación e integración incluidas. Las primeras 15 utilizan PostgreSQL y `mongomock` para aislar la bitácora; la prueba adicional verifica MongoDB real cuando se habilita expresamente:

| Prueba | Qué verifica |
|---|---|
| `test_salud` | El servicio responde |
| `test_swagger_disponible` | Swagger y el esquema OpenAPI se sirven |
| `test_listado_de_eventos_trae_cupos_calculados` | Coherencia de los cupos derivados |
| `test_flujo_completo_inscripcion_pago_y_acreditacion` | Flujo end-to-end con persistencia en ambas bases |
| `test_no_permite_doble_inscripcion` | 409 |
| `test_no_permite_superar_el_aforo` | 409 |
| `test_cancelar_libera_el_cupo` | El cupo vuelve a estar disponible |
| `test_no_permite_inscribirse_en_evento_borrador` | 422 |
| `test_no_publica_evento_sin_descripcion` | 422 |
| `test_no_reduce_aforo_bajo_inscritos` | 409 |
| `test_codigo_invalido_queda_registrado_en_mongo` | Escritura en MongoDB |
| `test_resumen_participacion_agrega_en_mongo` | Pipeline de agregación |
| `test_validacion_de_entrada_devuelve_422` | Validación de Pydantic |
| `test_recurso_inexistente_devuelve_404` | 404 |
| `test_indicadores_reflejan_las_inscripciones` | Consultas agregadas |
| `test_bitacora_acreditacion_en_mongo_real` | Escritura y lectura HTTP en una colección aislada de MongoDB real (opcional) |
| `test_ultimo_cupo_no_se_sobrevende_con_inscripciones_simultaneas` | Solicitudes concurrentes no exceden aforo |
| `test_pagos_simultaneos_reciben_comprobantes_unicos` | Pagos concurrentes reciben números únicos |
| `test_entrada_privada_exige_codigo` | Entrada ajena rechazada sin código correcto |
| `test_login_roles_y_permisos` | Login, sesión, 401 sin login y 403 por rol |

Para ejecutar **también la integración con MongoDB real** (necesita el servicio `mongo`):

```bash
docker compose exec -e RUN_MONGO_INTEGRACION=1 backend python -m pytest tests/ -v
```

Un workflow de GitHub Actions (`.github/workflows/hito3-ci.yml`) comprueba el
`lint` y `build` de React, inicia PostgreSQL/MongoDB y corre las pruebas con
MongoDB real en una base efímera de CI. **Consulta el estado del workflow o PR**:
la existencia del YAML no es evidencia de una ejecución aprobada.

La demostración manual en navegador (inscribir → pagar → acreditar → leer
bitácora, además de carga, error, vacío y responsive) debe documentarse con
capturas o un video obtenidos durante la ejecución; no se aportan capturas
simuladas como evidencias reales.

---

## 10. Limitaciones conocidas

- **Autenticación del organizador agregada.** Los endpoints administrativos requieren token de sesión y rol organizador. Las entradas públicas requieren su código original para consultas, cancelaciones y pagos. No existe aún registro con contraseña de asistentes ni recuperación automática de cuentas.
  Implementar sesiones y autorización por rol excedía el alcance de este hito;
  el modelo de datos ya contempla el campo `rol` para soportarlo.
- **El pago es simulado.** No hay pasarela real: la transacción se aprueba
  siempre y emite un comprobante. Es lo que el enunciado permite.
- **La acreditación es por código escrito.** El escaneo con cámara requiere
  HTTPS o `localhost` y quedó fuera del alcance.
- **El esquema se crea con `create_all`, no con migraciones versionadas.** Es
  reproducible pero no permite evolucionar el esquema conservando datos. Con
  Alembic sería lo correcto en un proyecto en producción.
- **El pronóstico sólo está disponible dentro del rango de Open-Meteo**, unos
  16 días. Los eventos más lejanos muestran el estado "sin datos".
- **Los asistentes se identifican por correo.** Sin cuentas de usuario, la
  vista "Mi entrada" muestra la última inscripción hecha en ese navegador.
- **Las credenciales de `.env.example` son de desarrollo local.** En un
  despliegue real deben generarse y no compartirse por el repositorio.

---

## 11. Uso de Inteligencia Artificial

El detalle completo está en [`docs/uso-ia.md`](docs/uso-ia.md).

---

## 12. Historial del proyecto

| Instancia | Entrega |
|---|---|
| Actividad Evaluada 1 | HTML5, CSS3, Bootstrap y JavaScript — raíz del repositorio |
| Taller Evaluado 2 | React con Vite, datos locales y API pública — `taller2-react/` |
| **Hito 3** | **Backend FastAPI, PostgreSQL, MongoDB y Docker — `backend/` + React integrado** |

El trabajo se organiza con Git Flow: `master` como rama estable, `develop` como
rama de integración y ramas `feature/` por funcionalidad, integradas mediante
Pull Request.


---

## Acceso seguro para la demostración Full Stack (Hito 3)

El panel del organizador **requiere iniciar sesión** en el modo Full Stack.
Se utiliza una nueva tabla SQL `credenciales` (sin modificar la tabla
`usuarios` de versiones anteriores), contraseñas PBKDF2-SHA256 con salt,
tokens temporales firmados con HMAC y verificación del rol desde PostgreSQL.
Los tokens se guardan solo en `sessionStorage` del navegador, y no en Git.

Después de iniciar con Docker y cargar el seed:

```bash
docker compose exec backend python -m app.seed

# Usa un correo organizador del seed y una contraseña propia de al menos 12 caracteres.
docker compose exec -e ORGANIZADOR_EMAIL=ingenieria@uandresbello.edu -e ORGANIZADOR_PASSWORD=CAMBIAR_POR_TU_CLAVE_PRIVADA_DE_12_O_MAS backend python -m app.configurar_organizador
```

**Cambia la contraseña del ejemplo antes de ejecutar el comando** y no la
incluyas en un commit ni en capturas. En un despliegue real, define
`AUTH_SECRET` con una cadena privada, aleatoria, de al menos 32 caracteres.
Si se deja vacío, el proceso genera un secreto efímero al iniciar y las
sesiones expirarán tras reiniciar. El archivo `.env` no debe subirse a Git.

La aplicación da acceso al panel únicamente después del login. Un asistente
puede inscribirse sin cuenta y conserva el id y el código de su última entrada
en el navegador. Para ver esa entrada, cancelarla o pagarla, debe enviar el
encabezado `X-Codigo-Entrada`; otro navegador sin el código recibe HTTP 403.
**Límite académico:** conocer el código equivale a poseer la entrada; aún no
hay verificación de correo, restablecimiento de contraseña ni autenticación
de todos los asistentes.

La API incluye `POST /api/auth/login` y `GET /api/auth/yo` en Swagger.

## GitHub Pages: demostración estática versus sistema Full Stack

La página pública se genera desde `taller2-react/` mediante
`.github/workflows/deploy-pages.yml`, con cambios en **master**. Como GitHub
Pages está configurado para publicar desde la raíz de `master`, el workflow
copia la compilación al directorio raíz sin borrar el proyecto. El index HTML
anterior de la Actividad 1 se conserva en `docs/actividad1-index-original.html`.
Dirección prevista:

https://crisito27.github.io/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR/

**GitHub Pages no ejecuta FastAPI, PostgreSQL ni MongoDB.** Si la variable
del repositorio `VITE_API_URL` no está definida, el workflow publica
automáticamente la aplicación React en **modo demostración**:

- Usa un conjunto explícito de eventos ficticios.
- Permite inscripciones, pagos simulados, QR, acreditación, panel y bitácora.
- Guarda el estado solo en `localStorage` de ese navegador: **no hay datos
  compartidos ni persistencia SQL/NoSQL en Pages**.
- Muestra una advertencia permanente y permite reiniciar los datos.
- No inventa un pronóstico meteorológico: cuando no existe API externa,
  muestra el estado sin datos.
- No tiene credenciales de organizador reales: el panel es parte de la demo.
  Nunca introduzcas contraseñas reales en esa versión.

Para que **Pages se conecte al sistema Full Stack en Internet**, primero hay
que alojar FastAPI, PostgreSQL y MongoDB en infraestructura externa con HTTPS.
Después configura en GitHub:
`Settings → Secrets and variables → Actions → Variables → New repository variable`,
nombre `VITE_API_URL`, valor `https://API-REAL-DEL-PROYECTO/api`.
Actualiza `CORS_ORIGENES` del backend con la dirección exacta de Pages.
Al volver a ejecutar el workflow de despliegue, React consumirá la API real
y desactivará el modo demo. **No configures una URL inexistente**: dejaría
los formularios sin conexión. GitHub Pages por sí solo no puede cubrir el
requisito de persistencia del Hito 3.

Evidencias verificables:
- Backend real: `.github/workflows/hito3-ci.yml` (suite con PostgreSQL/MongoDB).
- Demo visual real: `.github/workflows/evidencia-pages.yml`. Las capturas
  generadas por Chromium se adjuntan como artefacto `capturas-demo-acreditaqr`
  en la ejecución de Actions; no son pruebas de una base SQL en Pages.
- Guion de exposición: [docs/guia-defensa-hito3.md](docs/guia-defensa-hito3.md).

## Pendientes humanos

Cada integrante debe revisar los cambios, probar el flujo en su navegador,
completar su declaración de IA y explicar la arquitectura. Los resultados de
CI no reemplazan la demostración ni garantizan una calificación.

### Evidencia real de la demo de Pages

La primera ejecución exitosa de Chromium (en la rama de revisión) está en
https://github.com/crisito27/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR/actions/runs/42736581911 .
Su artefacto `capturas-demo-acreditaqr` contiene imágenes reales del
navegador (catálogo, ticket, acreditación, duplicado, pago simulado,
dashboard, bitácora y móvil). Esta evidencia **solo** acredita el modo demo;
la suite de Docker acredita PostgreSQL y MongoDB por separado.
