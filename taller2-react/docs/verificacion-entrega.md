# Verificación del cierre técnico — rama feature/realtime

Revisión técnica del repositorio realizada el 9 de noviembre de 2026. Esta revisión distingue validaciones automatizadas de comprobaciones que requieren ejecutar la aplicación en un navegador real.

## Estado de validación automatizada

| Comprobación | Resultado observado |
|---|---|
| Backend: instalación de dependencias | Correcta en GitHub Actions |
| Backend: carga de datos iniciales | Correcta en GitHub Actions |
| Backend: suite pytest | Correcta en GitHub Actions; 16 pruebas |
| Frontend: instalación reproducible con npm ci | Correcta en GitHub Actions |
| Frontend: ESLint | Correcto en GitHub Actions en el commit `6043bdb` |
| Frontend: build de producción | Correcto en GitHub Actions en el commit `6043bdb` |
| Escaneo QR con cámara | Implementado en `e42a604`; requiere validación manual en dispositivos/navegadores |
| Revisión visual completa y responsive | Pendiente de ejecución por el equipo |
| Flujo completo con clics en navegador | Pendiente de ejecución por el equipo |

**Ejecución automatizada confirmada:** workflow `Validación continua`, run `42704528636`, commit `2c84dd80441c91cd18ef7bf73f1fe5533a2b653f`. Los trabajos backend y frontend finalizaron con `success`: backend instaló dependencias, cargó el seed y ejecutó las 16 pruebas; frontend ejecutó `npm ci`, ESLint y build de producción. Esta ejecución incluye el escáner QR (`e42a604`) y la documentación actualizada.

## Cambios técnicos incluidos en el cierre

- Limpieza garantizada de conexiones WebSocket al desconectar o salir del endpoint.
- Prueba de integración que crea un evento por REST y verifica la notificación recibida por WebSocket.
- Workflow CI con PostgreSQL y MongoDB para backend y con lint/build para React.
- Correcciones de ESLint detectadas por la primera ejecución de CI.
- Escáner QR opcional con cámara mediante la API nativa `BarcodeDetector`; mantiene ingreso manual si el navegador no soporta lectura QR.

## Validaciones manuales que debe realizar el equipo

1. Ejecutar `docker compose up --build` y cargar datos con `docker compose exec backend python -m app.seed`.
2. Buscar y filtrar eventos; abrir el detalle de uno sin cupos.
3. Enviar el formulario con datos inválidos y verificar los mensajes.
4. Completar una inscripción válida y comprobar el ticket QR.
5. Repetir el mismo correo para el mismo evento y verificar el rechazo.
6. Si corresponde, probar pago simulado y comprobante.
7. Escanear el QR con cámara en un navegador compatible y probar también el ingreso manual.
8. Acreditar una entrada y volver a intentarlo; comprobar el rechazo del duplicado.
9. Revisar Dashboard y Bitácora; confirmar los cambios en dos ventanas mediante WebSocket.
10. Recargar **Mi entrada** y verificar que se recupera desde la API.
11. Probar en móvil y escritorio, tomar capturas reales y conservarlas como evidencia.
12. Verificar los estados de carga, error, vacío y reintento; probar el comportamiento sin conexión.

## Pendientes que no se pueden fabricar

- Adjuntar evidencia auténtica y fechada del diseño previo, si existe.
- Completar y revisar el reporte de uso de IA con la participación real de cada integrante.
- Aportar contribuciones individuales verificables desde las cuentas de los integrantes; no fabricar commits históricos.
- Ejecutar la demo manual, guardar capturas y ensayar la defensa.
- Probar el escáner en el teléfono/navegador concreto que se usará en la presentación.

Esta lista no certifica una nota ni reemplaza la revisión del docente. La ejecución automatizada no equivale a una demostración visual ni a una defensa oral.
