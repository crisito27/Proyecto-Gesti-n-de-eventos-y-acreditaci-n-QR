# Verificación del cierre de requisitos

Realizada por ChatGPT/Codex el 12 de octubre de 2026 UTC, a solicitud de Ignacio.
No acredita revisión personal del equipo ni diseño previo.

## Resultados

| Comprobación | Resultado |
|---|---|
| Instalación con npm ci | Correcta |
| npm run lint | Correcto |
| npm run build | Correcto |
| node --test tests/*.test.js | 5 pruebas correctas |
| HTTP real a Open-Meteo | 200 y JSON diario válido para el 18 de octubre de 2026 |
| Revisión visual en navegador | Pendiente: Chromium no está instalado y su descarga falló |
| Flujo completo con clics y capturas responsive | Pendiente por la misma limitación |

La respuesta meteorológica real se obtuvo para latitud -33.0238, longitud
-71.5531 y timezone=auto. Incluyó fecha 2026-10-18, mínima 13.4, máxima 18.7 y
weather_code=3. Es una observación de la consulta, no un pronóstico garantizado.

Las cinco pruebas cubren cupo disponible, cupo lleno, correo duplicado con
normalización, mismo correo en otro evento y evento inexistente. No sustituyen
las pruebas de interacción, persistencia, acreditación y diseño en navegador.

## Demo manual pendiente

1. Ejecutar npm run dev dentro de taller2-react.
2. Buscar y filtrar eventos; abrir el detalle de un evento agotado.
3. Enviar formulario inválido; corregirlo y generar una entrada.
4. Repetir el correo en ese evento y comprobar el rechazo.
5. Acreditar el código, intentar acreditarlo de nuevo y comprobar el dashboard.
6. Recargar y comprobar persistencia.
7. Abrir inscripción de evento exterior para consultar clima.
8. Desactivar red antes de abrirlo y comprobar error sin bloquear inscripción.
9. Repetir en anchos de celular y escritorio; tomar capturas reales.

## Pendientes personales

- Aportar evidencia auténtica del diseño previo, si existe.
- Revisar el código y completar las modificaciones humanas del reporte de IA.
- Contribuciones reales e identificables de los integrantes; estos cambios de
  Codex no sustituyen la participación individual.
- Ensayar la presentación y defensa con la guía ya incluida.
