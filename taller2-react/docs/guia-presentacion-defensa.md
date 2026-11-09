# Guía breve de presentación y defensa técnica — Hito 3

## Orden sugerido de la exposición

1. **Problema y usuarios:** inscripción, control de aforo y acreditación de asistentes.
2. **Continuidad con Taller 2:** mismo dominio y experiencia React; ahora los datos y reglas viven en el backend.
3. **Arquitectura:** React + FastAPI + PostgreSQL + MongoDB + Open-Meteo.
4. **Modelo y API:** entidades, endpoints, validaciones y Swagger.
5. **Frontend:** componentes, props, hooks, estados de carga/error y consumo REST.
6. **Tiempo real:** WebSocket notifica cambios y React vuelve a consultar la API.
7. **Demo:** inscripción, ticket QR, pago simulado si corresponde, check-in y dashboard.
8. **Persistencia y pruebas:** PostgreSQL, MongoDB, Docker y GitHub Actions.
9. **Uso de IA:** declarar el apoyo real y explicar qué se revisó.

## Demo recomendada

1. Ejecutar `docker compose up --build` y cargar los datos con `docker compose exec backend python -m app.seed`.
2. Abrir la aplicación React en `http://localhost:5173` y Swagger en `http://localhost:8000/docs`.
3. En **Eventos**, probar búsqueda, filtros y detalle.
4. Abrir inscripción e intentar enviar datos inválidos para mostrar las validaciones.
5. Completar una inscripción válida. Si el evento es pagado, mostrar el pago simulado y su comprobante.
6. Mostrar **Mi entrada** con el código único y el QR.
7. En **Organizador → Acreditación**, usar **Escanear código QR** si el navegador soporta `BarcodeDetector` y se concede permiso de cámara. Si no está disponible, pegar o escribir el código.
8. Acreditar la entrada y volver a intentarlo para demostrar el rechazo del duplicado.
9. Abrir **Dashboard** y **Bitácora** para mostrar los indicadores de PostgreSQL y los intentos registrados en MongoDB.
10. Mantener dos ventanas abiertas y provocar una inscripción o cambio desde una; comprobar que la otra recibe el aviso WebSocket y vuelve a consultar la API.
11. Recargar la página para comprobar que la inscripción se recupera desde la API usando el id guardado como referencia.
12. Reducir el ancho del navegador y repetir los controles principales para revisar responsive.

Usar datos ficticios: Persona Demo, `demo@example.com`, teléfono `912345678`. No utilizar datos personales de asistentes reales. Preparar una base de datos de demostración limpia antes de exponer.

## Preguntas probables y respuestas

### ¿Por qué dividieron la aplicación en componentes?
Para separar responsabilidades y reutilizar interfaz. Por ejemplo, `EventoCard` muestra un evento, `ModalInscripcion` captura datos y `CheckIn` gestiona la acreditación.

### ¿Qué información se pasa por props?
Los datos y callbacks que un componente necesita de su padre. Por ejemplo, `Organizador` recibe categorías, organizadores, eventos y `onCambio`; `CheckIn` recibe `onAcreditado`.

### ¿Qué estado vive en App.jsx?
La vista activa, la versión para recargar recursos, el id de la última inscripción, el evento que se va a inscribir y el detalle abierto. Los datos de dominio se consultan desde la API mediante hooks.

### ¿Qué estado es local?
Filtros y búsqueda de eventos; campos y errores de formularios; código, puerta, resultado y estado de cámara en `CheckIn`; y selección de pestaña en el panel del organizador.

### ¿Por qué se usa useEffect?
Para sincronizar React con sistemas externos: almacenamiento local, consultas HTTP, conexión WebSocket y cámara del dispositivo. Los componentes no deben usar efectos para calcular datos que pueden derivarse directamente del estado.

### ¿Qué provoca un nuevo render?
Una actualización de estado mediante `setState`. Por ejemplo, al cambiar de vista, recibir una notificación WebSocket, completar una inscripción o recibir el resultado de una consulta.

### ¿Por qué hay backend?
Para centralizar las reglas de negocio y persistir los datos. El navegador no decide si hay cupo, si el correo ya está inscrito o si una entrada puede acreditarse; el backend valida esas condiciones y PostgreSQL conserva el estado.

### ¿Qué hace FastAPI?
Expone la API REST, valida los datos con Pydantic, llama a los servicios de negocio y devuelve respuestas HTTP documentadas automáticamente con OpenAPI/Swagger.

### ¿Qué guarda cada base de datos?
PostgreSQL guarda el estado transaccional: usuarios, organizadores, eventos, inscripciones y pagos. MongoDB guarda la bitácora histórica de cada intento de acceso, incluso los rechazados.

### ¿Por qué no guardan todo en localStorage?
Porque los datos deben ser compartidos y consistentes entre navegadores. Sólo se guarda el id de la última inscripción como referencia; al abrir **Mi entrada**, el frontend vuelve a consultar el backend.

### ¿Cómo se calcula el aforo?
El backend cuenta las inscripciones que ocupan cupo en PostgreSQL. No se mantiene un contador duplicado en el navegador.

### ¿Qué hace el WebSocket?
Envía avisos de que un recurso cambió. No reemplaza a REST ni transporta la fuente de verdad: al recibir un aviso, React vuelve a pedir los datos actualizados a la API.

### ¿El pago es real?
No. Es una simulación que registra el pago y emite un comprobante; no se conecta a una pasarela ni cobra dinero.

### ¿El QR se puede escanear?
Sí, desde **Acreditación**, usando la cámara cuando el navegador implementa `BarcodeDetector`, permite acceso a la cámara y está en un contexto seguro (HTTPS o localhost). Si el navegador no ofrece esa API, se puede escribir o pegar el código.

### ¿Qué pasa si falla Open-Meteo?
El backend responde con un error de servicio y el frontend muestra el estado de error. La inscripción sigue disponible porque el pronóstico es complementario.

### ¿Qué pasa si falla una consulta de la API?
El frontend muestra el estado correspondiente y permite reintentar cuando corresponde. No se deben presentar datos inventados como si fueran actuales.

### ¿Qué parte fue apoyada por IA?
Responder usando el registro real de `docs/uso-ia.md`. Distinguir código generado o sugerido, decisiones del equipo y validaciones que efectivamente se ejecutaron.

## Archivos recomendados para abrir durante la defensa

- `taller2-react/src/App.jsx`: navegación, estado compartido y conexión en tiempo real.
- `taller2-react/src/hooks/useRecurso.js`: consulta HTTP, carga, error y recarga.
- `taller2-react/src/hooks/useTiempoReal.js`: WebSocket y reconexión.
- `taller2-react/src/components/ModalInscripcion.jsx`: formulario y validaciones.
- `taller2-react/src/components/Ticket.jsx`: representación del ticket QR.
- `taller2-react/src/components/CheckIn.jsx`: cámara, código y acreditación.
- `backend/app/services/inscripcion_service.py`: reglas de inscripción y cupos.
- `backend/app/services/acreditacion_service.py`: validación y registro de accesos.
- `backend/app/core/realtime.py`: publicación de notificaciones.
- `docker-compose.yml`: servicios y dependencias.

## Guion de ensayo

La distribución de diapositivas puede mantenerse como propuesta, pero cada integrante debe poder explicar el flujo completo. No atribuir autoría individual ni revisiones que no hayan ocurrido. La defensa debe basarse en lo que cada integrante realmente entiende y puede demostrar.

## Preparación técnica

- Confirmar que Docker está activo y que los cuatro servicios aparecen saludables.
- Cargar datos de demostración con el seed.
- Usar un perfil de navegador de prueba para evitar depender de una inscripción anterior.
- Probar permiso de cámara en el navegador que se usará para exponer. Tener preparado el ingreso manual como alternativa.
- Verificar el pronóstico para la fecha de los eventos exteriores.
- Revisar el resultado más reciente de GitHub Actions en la pestaña **Actions**.
- Restaurar conexión y permisos de cámara después de las pruebas Offline.
