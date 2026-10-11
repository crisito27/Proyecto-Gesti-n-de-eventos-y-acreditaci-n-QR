# AcreditaQR — Gestión de eventos y acreditación QR

Proyecto del curso **Desarrollo Web y Móvil**, Universidad Andrés Bello.

La entrega vigente corresponde al **Taller Evaluado 2 — Desarrollo de Frontend
con React**. La implementación anterior de la Actividad Evaluada 1 se conserva
en la raíz como referencia histórica, mientras que la versión evaluada actual
está en:

```text
taller2-react/
```

## Integrantes

- Benjamin Michea
- Cristian Perez
- Ignacio Cornejo

## Qué resuelve

AcreditaQR centraliza la inscripción y acreditación de asistentes a eventos
universitarios. Permite:

- buscar y filtrar eventos;
- inscribirse mediante formulario validado;
- generar una entrada digital con código y QR;
- acreditar asistentes por código;
- visualizar aforo, inscritos y asistentes;
- consultar pronóstico del tiempo para eventos al aire libre mediante Open-Meteo.

## Tecnologías de la entrega actual

- React + Vite
- JavaScript / JSX
- Bootstrap 5 + CSS propio
- JSON local
- localStorage
- Fetch API
- Open-Meteo
- qrcode.react
- Git / GitHub / Git Flow

## Ejecutar la versión React

```bash
cd taller2-react
npm install
npm run dev
```

## Documentación importante

- [README de la entrega React](taller2-react/README.md)
- [Diseño y wireframes](taller2-react/docs/diseno-interfaz.md)
- [Uso de Inteligencia Artificial](taller2-react/docs/uso-ia.md)
- [Guía de presentación y defensa](taller2-react/docs/guia-presentacion-defensa.md)
- [Evidencias pendientes del equipo](taller2-react/docs/evidencias-pendientes.md)

## Flujo de ramas

- `main`: versión estable de la entrega actual.
- `develop`: rama de integración.
- `feature/<nombre>`: funcionalidades o mejoras concretas.
- Pull Requests para integrar trabajo a `develop` y luego a `main`.

La rama `master` queda como referencia histórica del repositorio y no debe
usarse como rama principal de la entrega final.
