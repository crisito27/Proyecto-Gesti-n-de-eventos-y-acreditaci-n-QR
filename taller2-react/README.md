# AcreditaQR — Taller Evaluado 2 (React)

Aplicación frontend construida con **React + Vite** para la gestión de eventos
universitarios y la acreditación de asistentes mediante código QR.

Continúa la problemática trabajada en la Actividad Evaluada 1 (HTML5 + CSS3 +
Bootstrap + JavaScript), cuya implementación se conserva en la raíz de este
repositorio. Esta carpeta contiene la reimplementación con React.

## Integrantes

- Benjamin Michea
- Cristian Perez
- Ignacio Cornejo

## Problemática

Los seminarios, capacitaciones y ferias universitarias gestionan sus
inscripciones y el control de asistencia de forma manual, con planillas o listas
en papel. Eso hace difícil controlar el aforo, saber cuántos cupos quedan y
verificar quién asistió realmente.

**AcreditaQR** centraliza ese proceso en una interfaz única.

## Usuarios objetivo

| Usuario | Qué necesita |
|---|---|
| Asistente | Encontrar eventos con cupo, inscribirse y tener su entrada a mano |
| Organizador | Acreditar asistentes en la puerta y ver el aforo en tiempo real |

## Funcionalidades principales

1. Listado de eventos con buscador y filtros por categoría y disponibilidad.
2. Inscripción mediante formulario con validación propia.
3. Generación de una entrada digital con código único y su QR.
4. Acreditación (check-in) por código desde el panel del organizador.
5. Dashboard de aforo con inscritos, asistentes y cupos restantes.
6. Pronóstico del tiempo para la fecha y lugar del evento (API pública).

## Tecnologías utilizadas

- **React 19** — componentes, props, estado y renderizado declarativo
- **Vite** — herramienta de desarrollo y build
- **Bootstrap 5** — grilla, utilidades y componentes visuales
- **Bootstrap Icons** — iconografía
- **CSS3 propio** — variables, Flexbox, media queries e identidad visual
- **qrcode.react** — generación del QR en el navegador
- **Fetch API** — consumo de la API pública
- **JSON local** — datos iniciales, sin backend
- **localStorage** — persistencia de inscripciones entre recargas

## Cómo ejecutar el proyecto

```bash
cd taller2-react
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173/`.

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Estructura de la aplicación

```
taller2-react/
├── index.html
├── src/
│   ├── main.jsx                  # punto de entrada, importa estilos
│   ├── App.jsx                   # estado global y navegación entre vistas
│   ├── index.css                 # estilos propios
│   ├── data/
│   │   └── eventos.json          # datos iniciales (sin backend)
│   ├── services/
│   │   └── climaApi.js           # integración con Open-Meteo
│   ├── utils/
│   │   └── formato.js            # formato de fecha y generación de códigos
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
```

### Decisiones de arquitectura

- **El estado compartido vive en `App.jsx`.** Participantes, inscripciones y la
  vista activa se necesitan en más de una pantalla, así que se declaran en el
  componente raíz y bajan por props.
- **El estado local se queda donde se usa.** Los filtros viven en `Eventos.jsx`
  y el código escrito en el check-in vive en `CheckIn.jsx`, porque ningún otro
  componente los necesita.
- **No se guardan datos derivados.** El número de inscritos no es un contador
  aparte: se calcula sumando `aforoBase` (inscripciones previas simuladas) más
  las inscripciones registradas. Así el listado y el dashboard no pueden
  mostrar números contradictorios.
- **El modal no usa el JavaScript de Bootstrap.** Aparece y desaparece por
  renderizado condicional desde `App.jsx`; de Bootstrap sólo se usan las clases
  visuales.

## API pública utilizada

| Elemento | Detalle |
|---|---|
| Nombre | Open-Meteo |
| Documentación oficial | https://open-meteo.com/en/docs |
| Endpoint | `GET https://api.open-meteo.com/v1/forecast` |
| Método HTTP | GET |
| Parámetros enviados | `latitude`, `longitude`, `daily`, `timezone`, `start_date`, `end_date` |
| Datos utilizados | `daily.temperature_2m_max`, `daily.temperature_2m_min`, `daily.weather_code` |
| Dónde se muestra | En el modal de inscripción, sobre el formulario |
| Autenticación | No requiere clave de API |
| Implementación | `src/services/climaApi.js` y `src/components/ClimaEvento.jsx` |

### Justificación funcional

Varios de los eventos del catálogo son al aire libre (ferias, jornadas
deportivas). Antes de confirmar una inscripción, la persona ve qué temperatura y
qué condición se esperan ese día en ese lugar, lo que le permite decidir si
asiste y cómo prepararse. La API no es decorativa: responde a una pregunta real
que el usuario se hace antes de inscribirse.

### Manejo de errores

`ClimaEvento` contempla cuatro situaciones distintas:

- **Cargando** — indicador mientras la petición está en curso.
- **Error** — si la petición falla o la API responde con un estado distinto de
  200, se muestra un aviso y el formulario sigue siendo utilizable.
- **Sin datos** — el pronóstico de Open-Meteo cubre aproximadamente 16 días; si
  el evento está fuera de ese rango, se informa que aún no hay pronóstico.
- **Datos disponibles** — se muestran las temperaturas y la descripción.

## Uso de Inteligencia Artificial

Ver el detalle completo en [`docs/uso-ia.md`](docs/uso-ia.md).

## Limitaciones conocidas

- No hay backend ni base de datos: los datos viven en memoria y en
  `localStorage` del navegador. Son locales a ese equipo y ese navegador.
- No existe autenticación real. La vista "Mi entrada" muestra la última
  inscripción realizada en esa sesión, simulando un usuario único.
- El pronóstico sólo está disponible para fechas dentro del rango que entrega
  Open-Meteo.
- La acreditación se realiza escribiendo el código. El escaneo con cámara
  requiere HTTPS o `localhost` y quedó fuera del alcance de esta entrega.
- Los datos de aforo inicial son simulados y no corresponden a inscripciones
  reales registradas en la aplicación.
