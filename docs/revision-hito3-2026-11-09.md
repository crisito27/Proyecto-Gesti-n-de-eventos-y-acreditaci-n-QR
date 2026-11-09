# Auditoría Hito 3 — 9 de noviembre de 2026

Repositorio: `crisito27/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR` · base `master`.

Este documento diferencia **código inspeccionado**, **pruebas automatizadas agregadas** y **evidencias pendientes**. No garantiza una nota; la evaluación final y la defensa son del docente.

## Alcance contrastado con el enunciado

Caso 3.6: *Agenda de actividades y eventos*. Se identifican en el código y README: usuarios/organizadores, categorías, eventos (crear/editar/publicar/cancelar), inscripción con cupos y estados, pagos simulados/comprobantes, indicadores y acreditación. React consume la API FastAPI; PostgreSQL conserva estado relacional y MongoDB registros de acceso. Open-Meteo es la API pública complementaria.

## Matriz rápida por etapa

| Etapa | Criterios | Hallazgo en revisión estática | Evidencia aún necesaria |
|---|---|---|---|
| 1 · Diseño | Continuidad, ampliación, arquitectura, API | README explica cambios Taller 2 → Hito 3; modelos y rutas están presentes | Defender modelo y decisiones ante el docente |
| 2 · Backend | Estructura, REST, SQL, NoSQL, Swagger | Separación routers/services/models/schemas; acceso MongoDB desde backend; mejora de bloqueo del aforo propuesta en esta PR | Workflow de pruebas exitoso y recorrido de Swagger |
| 3 · React | Integración, flujos, UX, organización | Servicios HTTP, componentes, páginas y formularios presentes | Mostrar flujo real y pantallas responsive, carga, vacío, error |
| 4 · Entrega | End-to-end, pruebas, Docker, Git, README, IA | Docker Compose y scripts existentes; se agrega CI y prueba contra Mongo real | Verificar CI, realizar demo en vivo, documentar participación y validación humana |

## Deficiencias detectadas y atención

1. **Pruebas inaccesibles desde el contenedor**: el Dockerfile original sólo copiaba `app`. Se agrega `tests`.
2. **Dependencias frontend sin instalación determinista**: `npm install` al iniciar Compose. Se sustituye por `npm ci` usando el lockfile existente.
3. **Cupos bajo concurrencia**: el chequeo anterior leía el contador sin bloqueo, de modo que dos peticiones simultáneas podían pasar para el último cupo. Se agrega un bloqueo `SELECT FOR UPDATE` de la fila `eventos` que se mantiene hasta commit/rollback y se aplica a las operaciones que alteran el aforo/estado.
4. **Comprobantes bajo concurrencia**: el conteo simple podía generar el mismo correlativo en dos transacciones. Se reemplaza por máximo emitido bajo bloqueo transaccional, con prueba de pagos simultáneos.
5. **Uso real de MongoDB sin prueba independiente**: las pruebas existentes emplean `mongomock`. Se añade un caso opcional sobre un MongoDB real, integrado en CI.
6. **Evidencia no verificable desde el código**: no debe afirmarse que Docker, frontend o pruebas pasaron sin logs, capturas o ejecución real. Se explicita en README.

## Riesgos pendientes

- No hay login ni autorización por rol: los endpoints administrativos son públicos. El equipo debe justificarlo como limitación académica o implementar control de acceso antes de un despliegue accesible desde Internet.
- No hay migraciones versionadas; `Base.metadata.create_all` sólo inicializa tablas faltantes, no migra cambios estructurales sobre bases existentes.
- El índice SQL único `(evento_id, usuario_id)` evita duplicados, pero también impide volver a inscribirse luego de cancelar; el mensaje de error de ese caso debe aclararse o se debe diseñar una reactivación coherente con pagos previos.
- El correlativo de comprobantes se reforzó con bloqueo transaccional de PostgreSQL y cálculo del máximo emitido; se agregó una prueba con pagos simultáneos. No sustituye la recomendación de una secuencia en un entorno de producción.
- La actualización SQL y el registro MongoDB no forman una transacción distribuida; una falla entre ambas operaciones puede dejar un acceso acreditado sin bitácora. Para un entorno real se recomienda un patrón outbox/reintentos.
- El modo GitHub Pages existente no aloja el backend ni ambas bases; la demostración Full Stack requiere Docker Compose u otro despliegue completo.
- La sección de IA en `docs/uso-ia.md` tiene entradas que el equipo debe completar y validar; no se deben inventar experiencias individuales.
- No se comprobaron aquí los contenedores ni el navegador, por falta de un entorno de ejecución disponible en esta revisión. El workflow añadido permitirá obtener resultados verificables.

## Guion de validación para la defensa

1. `cp .env.example .env` (o `Copy-Item` en PowerShell) y `docker compose up --build -d`.
2. `docker compose exec backend python -m app.seed`.
3. Abrir React (`localhost:5173`) y Swagger (`localhost:8000/docs`).
4. Inscribir asistente en evento pagado; demostrar cupos, estado pendiente, pago simulado y comprobante.
5. Acreditar código, repetirlo y observar rechazo por duplicado.
6. Consultar `/api/inscripciones/{id}` (PostgreSQL) y `/api/registros-acceso` (MongoDB).
7. Ejecutar `docker compose exec -e RUN_MONGO_INTEGRACION=1 backend python -m pytest tests/ -v` y conservar la salida real.
8. Capturar los estados de carga/error/vacío y verificar al menos pantalla móvil y escritorio.
9. Revisar el historial de commits/PR y completar la validación humana en el registro IA.

**Aclaración de ponderación:** la tabla de 19 criterios con puntajes enviada por el estudiante suma 96; falta una asignación explícita a *Demostración y defensa* que sí aparece en el enunciado. Se debe confirmar con el docente.
