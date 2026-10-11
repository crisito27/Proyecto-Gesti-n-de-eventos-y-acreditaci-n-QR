# Revisión con commits — 11 de octubre de 2026

Esta revisión fue realizada con apoyo de ChatGPT/Codex a solicitud de Cristian. Los commits de la herramienta no demuestran por sí solos participación individual de todos los integrantes.

## Cambios reales

- La rama ya incluía una mejora de inicialización de localStorage y actualizaciones funcionales del estado React (cfb3bb2).
- El servicio de clima valida que las temperaturas y el código meteorológico sean números finitos. Si faltan datos, devuelve null y la interfaz muestra el mensaje de pronóstico no disponible.
- La consulta recibe una señal AbortSignal; el componente utiliza AbortController para cancelar solicitudes al desmontarse o cambiar de evento.
- Se corrigió el comentario que afirmaba que ClimaEvento era el único componente con useEffect: App también lo utiliza para persistencia.

## Validación realizada por Codex

- npm ci: correcto.
- npm run lint: correcto.
- npm run build: correcto.
- Pruebas con fetch simulado: respuesta válida, paso de la señal de cancelación, respuesta incompleta y error HTTP 503: correctas.

Estas comprobaciones no incluyen una demo en navegador ni una petición real a Open-Meteo. El equipo debe realizar esas pruebas antes de la entrega.

## Pendientes para Ignacio y el equipo

1. Buscar evidencia auténtica del diseño previo; guardarla en docs/evidencias y enlazarla en diseno-interfaz.md. No atribuir una fecha anterior a diseños nuevos.
2. Ejecutar la aplicación, probar inscripción, QR, acreditación duplicada, filtros, dashboard, clima y vista móvil; guardar capturas reales.
3. Revisar docs/uso-ia.md y completar las modificaciones humanas únicamente después de realizarlas. Incluir esta revisión de Codex en la explicación de uso de IA.
4. Cada integrante debe hacer una contribución real desde su cuenta y abrir un PR hacia develop. Estos commits automatizados no sustituyen sus aportes.
5. Ensayar la exposición con docs/guia-presentacion-defensa.md.
6. Cambiar la rama predeterminada de master a main desde la configuración de GitHub. No borrar la versión histórica sin acordarlo con el equipo.

Consultar docs/evidencias-pendientes.md para las instrucciones ampliadas.
