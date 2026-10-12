# AcreditaQR — Taller Evaluado 2 (React)

Aplicación frontend construida con **React + Vite** para la gestión de eventos
universitarios y la acreditación de asistentes mediante código QR.

Continúa la problemática trabajada en la Actividad Evaluada 1. La entrega actual
está implementada en esta carpeta y se organiza mediante componentes, props,
estado React, datos locales y una API pública.

## Integrantes

- Benjamin Michea
- Cristian Perez
- Ignacio Cornejo

## Problemática

Los seminarios, capacitaciones, ferias y actividades universitarias suelen
gestionar inscripciones y control de asistencia con planillas o listas manuales.
Eso dificulta controlar aforo, cupos disponibles y asistencia real.

**AcreditaQR** centraliza ese proceso en una interfaz única.

## Usuarios objetivo

| Usuario | Qué necesita |
|---|---|
| Asistente | Encontrar eventos con cupo, inscribirse y disponer de una entrada digital |
| Organizador | Acreditar asistentes y consultar el aforo actualizado |

## Funcionalidades principales

1. Listado de eventos con buscador y filtros por categoría/disponibilidad.
2. Inscripción mediante formulario controlado y validación propia.
3. Generación de entrada digital con código único y QR.
4. Persistencia de inscripciones en `localStorage`.
5. Acreditación por código desde el panel del organizador.
6. Prevención de doble acreditación.
7. Dashboard de aforo, inscritos, asistentes y cupos restantes.
8. Pronóstico del tiempo para eventos al aire libre mediante API pública.
9. Estados de carga, error y ausencia de datos en la integración de la API.
10. Diseño responsive con Bootstrap y CSS propio.

## Tecnologías utilizadas

- **React 19** — componentes, props, estado y renderizado declarativo
- **Vite** — entorno de desarrollo y build
- **Bootstrap 5** — grilla, utilidades y componentes visuales
- **Bootstrap Icons** — iconografía
- **CSS3 propio** — variables, Flexbox, media queries e identidad visual
- **qrcode.react** — generación del QR en el navegador
- **Fetch API** — consumo de la API pública
- **JSON local** — fuente de datos inicial
- **localStorage** — persistencia local sin backend

## Cómo ejecutar

```bash
cd taller2-react
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:5173/`.

Verificaciones recomendadas antes de entregar:

```bash
npm run lint
node --test tests/*.test.js
npm run build
npm run preview
```

## Estructura

```text
taller2-react/
├── index.html
├── docs/
│   ├── diseno-interfaz.md
│   ├── evidencias-pendientes.md
│   ├── guia-presentacion-defensa.md
│   └── uso-ia.md
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── data/
│   │   └── eventos.json
│   ├── services/
│   │   └── climaApi.js
│   ├── utils/
│   │   └── formato.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── FiltrosEventos.jsx
│   │   ├── ListaEventos.jsx
│   │   ├── EventoCard.jsx
│   │   ├── ModalInscripcion.jsx
│   │   ├── ClimaEvento.jsx
│   │   ├── Ticket.jsx
│   │   ├── CheckIn.jsx
│   │   └── Dashboard.jsx
│   └── pages/
│       ├── Eventos.jsx
│       ├── MiEntrada.jsx
│       └── Organizador.jsx
└── vite.config.js
```

## Decisiones de arquitectura

- **Estado compartido en `App.jsx`:** participantes, inscripciones, vista activa
  y entrada actual se necesitan en más de una pantalla.
- **Estado local donde corresponde:** filtros, formulario, check-in y consulta
  meteorológica se mantienen en los componentes que realmente los usan.
- **Datos derivados no se duplican:** el total de inscritos se calcula a partir
  de `aforoBase` más las inscripciones nuevas.
- **Renderizado condicional:** vistas, modal, mensajes, estados vacíos y
  resultados se muestran según el estado React.
- **Sin backend:** los datos iniciales están en JSON y la persistencia se simula
  con `localStorage`, de acuerdo con el alcance del taller.

## Diseño previo y flujos

La navegación, wireframes de referencia, jerarquía visual, componentes
repetibles, responsive y decisiones de diseño están documentados en:

[docs/diseno-interfaz.md](docs/diseno-interfaz.md)

El equipo debe complementar ese documento con evidencia real y fechada de diseño
previo si dispone de ella. Las instrucciones están en:

[docs/evidencias-pendientes.md](docs/evidencias-pendientes.md)

## API pública utilizada

| Elemento | Detalle |
|---|---|
| Nombre | Open-Meteo |
| Documentación oficial | https://open-meteo.com/en/docs |
| Endpoint | `GET https://api.open-meteo.com/v1/forecast` |
| Método HTTP | GET |
| Parámetros | `latitude`, `longitude`, `daily`, `timezone`, `start_date`, `end_date` |
| Datos usados | temperaturas máxima/mínima y `weather_code` |
| Dónde se muestra | Modal de inscripción de eventos al aire libre |
| Autenticación | No requiere clave de API |
| Implementación | `src/services/climaApi.js` + `src/components/ClimaEvento.jsx` |

### Justificación funcional

En actividades exteriores, el clima puede cambiar la decisión de asistir o la
preparación necesaria. Mostrar el pronóstico antes de confirmar la inscripción
aporta información directamente relacionada con ese flujo.

### Manejo de estados

`ClimaEvento` contempla:

- **Cargando:** indicador durante la petición.
- **Error:** muestra aviso sin impedir la inscripción.
- **Sin datos:** informa que todavía no existe pronóstico utilizable.
- **Datos disponibles:** muestra temperaturas y descripción meteorológica.

## Uso de Inteligencia Artificial

El reporte se encuentra en [docs/uso-ia.md](docs/uso-ia.md). Debe reflejar
únicamente usos reales y ser revisado por el equipo antes de entregar.

## Limitaciones conocidas

- No existe backend ni base de datos.
- Los datos agregados se guardan sólo en el navegador actual.
- No existe autenticación real.
- “Mi entrada” representa la última inscripción del usuario simulado.
- El pronóstico depende del rango disponible de la API.
- La acreditación usa el código escrito; el escaneo por cámara no forma parte de
  esta entrega.
- El aforo inicial es simulado.

## Presentación y defensa

La pauta sugerida de demo y preguntas técnicas está en
[docs/guia-presentacion-defensa.md](docs/guia-presentacion-defensa.md).

## Detalle y reglas de inscripción

Cada tarjeta permite consultar el detalle completo, incluso sin cupos. Al
confirmar se vuelve a comprobar el aforo y se impide usar el mismo correo para
inscribirse dos veces en un evento (ignorando mayúsculas y espacios exteriores).
Estas reglas se aplican a las inscripciones locales: `aforoBase` no incluye
identidades y no hay sincronización entre dispositivos.

## Condiciones de Open-Meteo

Consultadas el 12 de octubre de 2026 (UTC).
La API abierta se utiliza sin clave para este proyecto educativo no comercial.
Sus condiciones indican menos de 10.000 llamadas diarias, 5.000 por hora y 600
por minuto. El servicio gratuito no garantiza disponibilidad. Los datos usan
CC BY 4.0; la interfaz enlaza al proveedor y a la licencia junto al pronóstico,
e indica el redondeo de temperaturas y la traducción de descripciones.
La licencia de datos no elimina las restricciones del servicio gratuito.

El pronóstico alcanza hasta 16 días, según modelo y disponibilidad. Datos
incompletos muestran ausencia de pronóstico; un rechazo HTTP o fallo de red
muestra un error sin impedir la inscripción. Antes de la demo, comprobar que
las fechas de los eventos exteriores están dentro del rango disponible.

Fuentes oficiales:
- https://open-meteo.com/en/docs
- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing
- https://creativecommons.org/licenses/by/4.0/

## Verificación de esta entrega

Consultar [el registro de verificación](docs/verificacion-entrega.md). Las
pruebas técnicas no sustituyen la revisión personal ni la defensa del equipo.
