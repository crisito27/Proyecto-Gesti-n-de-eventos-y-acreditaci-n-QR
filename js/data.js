/* =========================================================
   data.js
   Datos simulados de la aplicación (sin backend ni base de
   datos: todo vive en memoria como arrays de objetos).
   ========================================================= */

// ---- Entidad: Eventos ----
// aforoActual = personas ya inscritas en el evento.
var eventos = [
  {
    id: 1,
    nombre: "Seminario de Inteligencia Artificial Aplicada",
    descripcion: "Charlas y paneles sobre el uso práctico de IA en la industria chilena.",
    categoria: "Seminario",
    fecha: "2026-10-14",
    lugar: "Auditorio Central, UNAB Viña del Mar",
    organizador: "Escuela de Ingeniería",
    aforoMax: 60,
    aforoActual: 42
  },
  {
    id: 2,
    nombre: "Capacitación en Git y control de versiones",
    descripcion: "Taller práctico de Git, GitHub y Git Flow para equipos de desarrollo.",
    categoria: "Capacitación",
    fecha: "2026-09-20",
    lugar: "Laboratorio 3, Edificio B",
    organizador: "Centro de Estudiantes Informática",
    aforoMax: 30,
    aforoActual: 30
  },
  {
    id: 3,
    nombre: "Feria de Emprendimiento Estudiantil",
    descripcion: "Exposición de proyectos y startups desarrolladas por estudiantes.",
    categoria: "Feria",
    fecha: "2026-11-05",
    lugar: "Explanada Campus Viña del Mar",
    organizador: "Taller de Innovación y Emprendimiento",
    aforoMax: 150,
    aforoActual: 88
  },
  {
    id: 4,
    nombre: "Taller de Diseño de Redes",
    descripcion: "Práctica guiada de diseño de topologías de red para pymes.",
    categoria: "Taller",
    fecha: "2026-09-27",
    lugar: "Sala de Redes, Edificio C",
    organizador: "Docente Infraestructura TI",
    aforoMax: 25,
    aforoActual: 9
  },
  {
    id: 5,
    nombre: "Seminario de Minería de Datos",
    descripcion: "Casos de aplicación de análisis de datos en distintas industrias.",
    categoria: "Seminario",
    fecha: "2026-10-29",
    lugar: "Auditorio Central, UNAB Viña del Mar",
    organizador: "Escuela de Ingeniería",
    aforoMax: 60,
    aforoActual: 12
  }
];

// ---- Entidad: Participantes ----
// Se completa dinámicamente cuando alguien se inscribe.
var participantes = [];

// ---- Entidad: Inscripciones (incluye el rol de "Entrada/QR") ----
// estado: "inscrito" | "asistio"
var inscripciones = [];

// Contador simple para generar ids incrementales de participantes/inscripciones.
var siguienteIdParticipante = 1;
var siguienteIdInscripcion = 1;
