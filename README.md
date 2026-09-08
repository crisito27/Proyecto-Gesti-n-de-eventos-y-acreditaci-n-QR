# AcreditaQR — Gestión de eventos y acreditación QR

Proyecto para la **Actividad Evaluada 1 — Desarrollo de Interfaz Frontend**
(curso Desarrollo Web y Móvil, Universidad Andrés Bello).

## Integrantes

- Nombre Apellido — rol
- Nombre Apellido — rol

*(completar con los integrantes reales del equipo)*

## Problemática

Los seminarios pequeños, capacitaciones, ferias y actividades académicas
suelen gestionar sus inscripciones y el control de asistencia de forma
manual (planillas, listas en papel), lo que dificulta controlar el aforo
y verificar quién asistió realmente.

**AcreditaQR** resuelve esto con una interfaz frontend que permite:

- Publicar eventos y que el público se inscriba directamente.
- Generar una entrada digital con un **código QR único** por inscripción.
- Que el organizador haga **check-in** ingresando el código.
- Ver un **dashboard en vivo** con el aforo, inscritos y asistentes por evento.
- Emitir un **certificado en PDF** para quienes asistieron (extensión).

No se implementa backend, base de datos ni APIs externas: todos los datos
(eventos, participantes, inscripciones) se simulan en memoria mediante
arrays y objetos JavaScript (`js/data.js`).

## Tecnologías

- HTML5 semántico
- CSS3 propio (variables, Flexbox, motivo visual de "ticket perforado")
- Bootstrap 5 (grid, navbar, modal, badges, progress bar)
- JavaScript (DOM, eventos, validación de formularios, arrays de objetos)
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) — generación de códigos QR en el navegador (librería JS, sin servidor)
- [jsPDF](https://github.com/parallax/jsPDF) — generación de certificados en PDF en el navegador
- Git / GitHub / Git Flow

## Estructura del proyecto

```
proyecto/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── data.js      # datos simulados (eventos, participantes, inscripciones)
│   └── app.js        # lógica de la aplicación
├── assets/
└── README.md
```

## Cómo ejecutar

No requiere instalación. Basta con abrir `index.html` en un navegador,
o servirlo con una extensión tipo "Live Server" para evitar restricciones
de algunos navegadores con archivos locales.

## Flujo funcional

1. **Eventos** — listado público con buscador y filtros por categoría/disponibilidad.
2. **Inscripción** — formulario con validación (nombre, correo, teléfono) que genera una entrada con QR único y descuenta cupo.
3. **Mi entrada** — muestra el ticket con el QR generado y el estado (inscrito / asistió).
4. **Organizador → Check-in** — busca una entrada por su código y confirma la asistencia.
5. **Organizador → Dashboard** — cupos, inscritos y asistentes por evento, actualizados en vivo.
6. **Certificado** — una vez registrada la asistencia, se puede descargar un PDF de participación.

## Flujo de trabajo (Git Flow)

- `main`: versión estable.
- `develop`: rama de integración.
- `feature/<nombre>`: una rama por funcionalidad o integrante (ej. `feature/inscripcion`, `feature/checkin`, `feature/dashboard`).
- Los cambios se integran a `develop` mediante **Pull Request**, no con push directo.
- Historial de commits descriptivo, reflejando el aporte de cada integrante.
