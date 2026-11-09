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
| Estado completo en `localStorage` | Sólo el id de la última inscripción, como referencia |

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

16 pruebas automatizadas sobre la API, ejecutadas contra PostgreSQL real y MongoDB simulado para los casos que no requieren el servidor:

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
| `test_websocket_notifica_cambios_reales_del_backend` | Publicación de cambios REST a clientes WebSocket |

El frontend se verificó manualmente recorriendo el flujo completo en el
navegador, incluyendo los estados de carga, error y vacío, y el comportamiento
responsive.

---

## 10. Limitaciones conocidas

- **No hay autenticación.** Cualquiera puede acceder al panel del organizador.
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

## 10. Actualizaciones en tiempo real

El backend expone el canal **WebSocket** `ws://localhost:8000/ws` (en producción,
usar `wss://`). Cuando se crea, modifica, publica, cancela o elimina un evento,
se registra una inscripción, se cancela una inscripción, se registra un pago
o se procesa un intento de acreditación, FastAPI publica un mensaje JSON a los
clientes conectados.

Ejemplo de mensaje:

```json
{
  "tipo": "inscripcion.creada",
  "recurso": "inscripciones",
  "recurso_id": 42
}
```

React se conecta mediante el hook `useTiempoReal`. Al recibir una notificación,
actualiza el token de recarga y vuelve a consultar la API REST; el WebSocket
transporta avisos de cambios, no reemplaza a PostgreSQL ni MongoDB como fuentes
de verdad. El hook muestra el estado de conexión y reintenta automáticamente
con espera incremental cuando se pierde la conexión.

**Alcance técnico:** el gestor de conexiones actual vive en memoria y está
pensado para una instancia de FastAPI (como la ejecución de Docker Compose de
este proyecto). Si se despliegan varios workers o réplicas, se debe incorporar
un bus compartido como Redis Pub/Sub para propagar eventos entre procesos.
Los mensajes no contienen datos personales; el frontend vuelve a consultar
los recursos autorizados mediante REST.

## 11. Ejecución y validación

1. Copiar `.env.example` a `.env` y completar las variables locales.
2. Ejecutar `docker compose up --build`.
3. Comprobar `http://localhost:8000/salud` y abrir `http://localhost:8000/docs`.
4. Abrir la aplicación en `http://localhost:5173` en dos ventanas o navegadores.
5. Crear/publicar un evento o realizar una inscripción desde una ventana y
   comprobar que la otra vuelve a consultar los datos al recibir el aviso.
6. Registrar un pago o intentar acreditar una entrada y verificar que la
   bitácora MongoDB y los indicadores reflejen el resultado.

Para ejecutar las pruebas automatizadas del backend desde la carpeta
`backend` con el entorno virtual activo: `pytest -q`. La ejecución de esta
suite y la comprobación de los flujos en Docker deben registrarse como evidencia
del equipo antes de la entrega; la presencia de los archivos de prueba por sí
sola no demuestra que hayan pasado.

## 12. Uso de herramientas de IA

Si se utilizó ChatGPT u otra herramienta de IA durante el desarrollo, declararlo
en la entrega con: herramienta y versión disponible, objetivo, prompts
principales, archivos o decisiones en que ayudó, cambios revisados por el equipo
y pruebas realizadas por los integrantes. La IA no sustituye la validación:
cada integrante debe poder explicar el flujo React → API REST/WebSocket →
servicios → PostgreSQL/MongoDB y las limitaciones descritas en esta sección.


## 13. Integración continua

El flujo de GitHub Actions definido en `.github/workflows/ci.yml` valida cada
push a `master`, `develop` y ramas `feature/**`, además de los Pull Requests
hacia las ramas de integración. Ejecuta la suite del backend con PostgreSQL y
MongoDB como servicios, y comprueba en el frontend la instalación reproducible,
el análisis ESLint y la compilación de producción. El resultado de cada
ejecución queda visible en la pestaña **Actions** del repositorio.
