/*
 * Demo autónoma de AcreditaQR para GitHub Pages (hosting estático).
 *
 * ATENCIÓN: los datos son FICTICIOS y permanecen solo en el navegador.
 * Esta capa NO constituye el backend FastAPI ni demuestra PostgreSQL/MongoDB.
 * El modo Full Stack normal sigue consumiendo exclusivamente la API propia.
 */
const CLAVE = "acreditaqr-demo-local-v2";
const ahora = () => new Date().toISOString();
const fechaMas = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};
const categorias = [
  { id: 1, nombre: "Seminario" },
  { id: 2, nombre: "Capacitación" },
  { id: 3, nombre: "Feria" },
  { id: 4, nombre: "Taller" },
];
const organizadores = [
  { id: 1, usuario_id: 1, nombre_organizacion: "Escuela de Ingeniería" },
  { id: 2, usuario_id: 2, nombre_organizacion: "Centro de Estudiantes" },
  { id: 3, usuario_id: 3, nombre_organizacion: "Dirección de Deportes" },
];
const eventosIniciales = [
  ["Seminario de Inteligencia Artificial", "Charlas sobre aplicaciones académicas de IA.", 1, 1, 4, "Auditorio Campus", 50, 0, false],
  ["Capacitación práctica de Git", "Introducción al trabajo colaborativo con Git.", 2, 2, 6, "Laboratorio 3", 25, 5000, false],
  ["Feria de Emprendimiento", "Presentación de proyectos estudiantiles.", 3, 1, 8, "Explanada del Campus", 120, 0, true],
  ["Taller de Redes", "Conceptos de infraestructura y conectividad.", 4, 2, 11, "Sala de Redes", 30, 8000, false],
  ["Jornada Deportiva", "Actividades universitarias al aire libre.", 3, 3, 14, "Canchas Campus", 90, 0, true],
];

function semilla() {
  return {
    categorias, organizadores,
    eventos: eventosIniciales.map(([nombre, descripcion, categoria_id, organizador_id, dias, lugar, aforo_max, precio, exterior], i) => ({
      id: i + 1, nombre, descripcion, categoria_id, organizador_id,
      fecha: fechaMas(dias), lugar, aforo_max, precio, exterior,
      latitud: -33.0245, longitud: -71.5518, estado: "publicado", creado_en: ahora(),
    })),
    usuarios: [], inscripciones: [], pagos: [], registros: [], ultimo: 100,
  };
}
function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    if (datos && Array.isArray(datos.eventos) && Array.isArray(datos.inscripciones)) return datos;
  } catch { /* datos dañados o almacenamiento bloqueado */ }
  return semilla();
}
function guardar(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
  catch { throw new Error("El navegador no permite guardar cambios locales en esta demostración."); }
}
function fallo(mensaje, codigo, estado = 409) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  error.estado = estado;
  throw error;
}
function obtener(lista, id) {
  const encontrado = lista.find((x) => x.id === Number(id));
  if (!encontrado) fallo("No se encontró el recurso solicitado.", "no_encontrado", 404);
  return encontrado;
}
const activos = (x) => x.estado !== "cancelada";
function eventoSalida(datos, evento) {
  const inscritos = datos.inscripciones.filter((x) => x.evento_id === evento.id && activos(x)).length;
  const disponibles = Math.max(0, Number(evento.aforo_max) - inscritos);
  return {
    ...evento,
    categoria: datos.categorias.find((c) => c.id === evento.categoria_id)?.nombre ?? "",
    organizador: datos.organizadores.find((o) => o.id === evento.organizador_id)?.nombre_organizacion ?? "",
    inscritos, cupos_disponibles: disponibles, agotado: disponibles === 0,
  };
}
function inscripcionSalida(datos, inscripcion) {
  const usuario = obtener(datos.usuarios, inscripcion.usuario_id);
  const pago = datos.pagos.find((p) => p.inscripcion_id === inscripcion.id);
  return {
    ...inscripcion,
    evento: eventoSalida(datos, obtener(datos.eventos, inscripcion.evento_id)),
    usuario,
    pagada: pago?.estado === "pagado",
  };
}
function comprobante(datos, pago) {
  const inscripcion = obtener(datos.inscripciones, pago.inscripcion_id);
  const evento = obtener(datos.eventos, inscripcion.evento_id);
  const usuario = obtener(datos.usuarios, inscripcion.usuario_id);
  return {
    numero_comprobante: pago.numero_comprobante,
    emitido_en: pago.pagado_en,
    evento: evento.nombre, fecha_evento: evento.fecha, lugar: evento.lugar,
    asistente: usuario.nombre, email: usuario.email, codigo_acreditacion: inscripcion.codigo,
    monto: pago.monto, metodo: pago.metodo, estado: pago.estado,
  };
}
function indicadores(datos) {
  const por_evento = datos.eventos.map((e) => {
    const inscritos = datos.inscripciones.filter((i) => i.evento_id === e.id && activos(i));
    const pagos = datos.pagos.filter((p) => p.estado === "pagado" && inscritos.some((i) => i.id === p.inscripcion_id));
    return {
      evento_id: e.id, nombre: e.nombre, fecha: e.fecha, aforo_max: Number(e.aforo_max),
      inscritos: inscritos.length, confirmados: inscritos.filter((i) => i.estado === "confirmada").length,
      acreditados: inscritos.filter((i) => i.estado === "acreditada").length,
      cupos_disponibles: Math.max(0, Number(e.aforo_max) - inscritos.length),
      ocupacion_pct: Number((100 * inscritos.length / Number(e.aforo_max)).toFixed(1)),
      recaudado: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
    };
  });
  return {
    total_eventos: datos.eventos.length,
    eventos_publicados: datos.eventos.filter((e) => e.estado === "publicado").length,
    total_inscripciones: por_evento.reduce((n, e) => n + e.inscritos, 0),
    total_acreditados: por_evento.reduce((n, e) => n + e.acreditados, 0),
    recaudacion_total: por_evento.reduce((n, e) => n + e.recaudado, 0),
    por_evento,
  };
}
export function reiniciarDemo() {
  guardar(semilla());
  localStorage.removeItem("acreditaqr-inscripcion-id");
}
export async function demoSolicitar(ruta, opciones = {}) {
  const metodo = opciones.method ?? "GET";
  const url = new URL(ruta, "https://demo.local");
  const path = url.pathname.split("/").filter(Boolean);
  const q = url.searchParams;
  const body = opciones.body ? JSON.parse(opciones.body) : {};
  const datos = cargar();
  const aceptar = (resultado, cambia = false) => {
    if (cambia) guardar(datos);
    return structuredClone(resultado);
  };
  const eventoId = path[0] === "eventos" ? Number(path[1]) : null;
  const inscripcionId = path[0] === "inscripciones" ? Number(path[1]) : null;

  if (path[0] === "categorias") return aceptar(datos.categorias);
  if (path[0] === "organizadores") return aceptar(datos.organizadores);
  if (path[0] === "eventos") {
    if (path.length === 1 && metodo === "GET") {
      return aceptar(datos.eventos.filter((e) =>
        (!q.get("estado") || e.estado === q.get("estado")) &&
        (!q.get("categoria_id") || e.categoria_id === Number(q.get("categoria_id"))) &&
        (!q.get("organizador_id") || e.organizador_id === Number(q.get("organizador_id"))) &&
        (!q.get("texto") || (e.nombre + " " + e.lugar).toLowerCase().includes(q.get("texto").toLowerCase()))
      ).map((e) => eventoSalida(datos, e)));
    }
    if (path.length === 1 && metodo === "POST") {
      if (!datos.categorias.some((c) => c.id === Number(body.categoria_id))) fallo("Categoría inexistente.", "no_encontrado", 404);
      if (!datos.organizadores.some((o) => o.id === Number(body.organizador_id))) fallo("Organizador inexistente.", "no_encontrado", 404);
      const evento = {
        ...body, id: ++datos.ultimo, categoria_id: Number(body.categoria_id),
        organizador_id: Number(body.organizador_id), aforo_max: Number(body.aforo_max),
        precio: Number(body.precio), estado: "borrador", creado_en: ahora(),
      };
      datos.eventos.push(evento);
      return aceptar(eventoSalida(datos, evento), true);
    }
    const evento = obtener(datos.eventos, eventoId);
    if (path[2] === "clima") return null; // Sin inventar datos de Open-Meteo.
    if (path[2] === "participacion") {
      const registros = datos.registros.filter((x) => x.evento_id === eventoId);
      const count = (v) => registros.filter((x) => x.resultado === v).length;
      return aceptar({
        evento_id: eventoId, total_intentos: registros.length,
        acreditados: count("acreditado"), duplicados: count("duplicado"),
        codigos_invalidos: count("codigo_invalido"),
        otros_rechazos: registros.length - count("acreditado") - count("duplicado") - count("codigo_invalido"),
        primer_acceso: registros.at(-1)?.ocurrido_en ?? null, ultimo_acceso: registros[0]?.ocurrido_en ?? null,
      });
    }
    if (path.length === 2 && metodo === "GET") return aceptar(eventoSalida(datos, evento));
    if (path.length === 2 && metodo === "PUT") {
      if (evento.estado === "cancelado") fallo("No se puede editar un evento cancelado.", "evento_cancelado", 422);
      const ocupados = eventoSalida(datos, evento).inscritos;
      if (body.aforo_max && Number(body.aforo_max) < ocupados) fallo("El aforo no puede ser menor a los inscritos.", "aforo_menor_que_inscritos");
      Object.assign(evento, body);
      return aceptar(eventoSalida(datos, evento), true);
    }
    if (path[2] === "publicar") {
      if (!evento.descripcion?.trim()) fallo("Completa la descripción.", "descripcion_requerida", 422);
      if (evento.estado !== "borrador") fallo("Solo puedes publicar borradores.", "evento_ya_publicado");
      evento.estado = "publicado";
      return aceptar(eventoSalida(datos, evento), true);
    }
    if (path[2] === "cancelar") {
      evento.estado = "cancelado";
      datos.inscripciones.filter((i) => i.evento_id === eventoId && activos(i)).forEach((i) => { i.estado = "cancelada"; });
      return aceptar(eventoSalida(datos, evento), true);
    }
    if (path.length === 2 && metodo === "DELETE") {
      if (datos.inscripciones.some((i) => i.evento_id === eventoId)) fallo("Este evento tiene inscripciones y debe conservar su historial.", "evento_con_inscritos");
      datos.eventos = datos.eventos.filter((e) => e.id !== eventoId);
      guardar(datos); return null;
    }
  }
  if (path[0] === "inscripciones") {
    if (path[1] === "publica" && metodo === "POST") {
      const evento = obtener(datos.eventos, body.evento_id);
      if (evento.estado !== "publicado") fallo("El evento no está publicado.", "evento_no_publicado", 422);
      if (eventoSalida(datos, evento).agotado) fallo("El evento alcanzó el aforo máximo.", "aforo_completo");
      let usuario = datos.usuarios.find((x) => x.email.toLowerCase() === body.email.toLowerCase());
      if (!usuario) {
        usuario = { id: ++datos.ultimo, nombre: body.nombre, email: body.email, telefono: body.telefono, rol: "asistente", creado_en: ahora() };
        datos.usuarios.push(usuario);
      }
      if (datos.inscripciones.some((i) => i.evento_id === evento.id && i.usuario_id === usuario.id && activos(i))) {
        fallo("Esta persona ya está inscrita en el evento.", "inscripcion_duplicada");
      }
      const inscripcion = {
        id: ++datos.ultimo, evento_id: evento.id, usuario_id: usuario.id,
        codigo: "EVQR-DEMO-" + crypto.randomUUID().slice(0, 12).toUpperCase(),
        estado: Number(evento.precio) ? "pendiente_pago" : "confirmada",
        creada_en: ahora(), acreditada_en: null,
      };
      datos.inscripciones.push(inscripcion);
      return aceptar(inscripcionSalida(datos, inscripcion), true);
    }
    if (path.length === 2 && metodo === "GET") return aceptar(inscripcionSalida(datos, obtener(datos.inscripciones, inscripcionId)));
    if (path[2] === "cancelar") {
      const inscripcion = obtener(datos.inscripciones, inscripcionId);
      if (inscripcion.estado === "acreditada") fallo("No se puede cancelar una entrada acreditada.", "inscripcion_acreditada", 422);
      inscripcion.estado = "cancelada";
      return aceptar(inscripcionSalida(datos, inscripcion), true);
    }
    if (path[1] === "codigo") {
      const inscripcion = datos.inscripciones.find((x) => x.codigo === decodeURIComponent(path[2]).toUpperCase());
      if (!inscripcion) fallo("Código inexistente.", "no_encontrado", 404);
      return aceptar(inscripcionSalida(datos, inscripcion));
    }
    if (path.length === 1) return aceptar(datos.inscripciones);
  }
  if (path[0] === "pagos") {
    if (path.length === 1 && metodo === "POST") {
      const inscripcion = obtener(datos.inscripciones, body.inscripcion_id);
      if (inscripcion.estado === "cancelada") fallo("Inscripción cancelada.", "inscripcion_cancelada", 422);
      if (datos.pagos.some((x) => x.inscripcion_id === inscripcion.id)) fallo("Pago ya registrado.", "pago_duplicado");
      const monto = Number(obtener(datos.eventos, inscripcion.evento_id).precio);
      const pago = {
        id: ++datos.ultimo, inscripcion_id: inscripcion.id, monto,
        metodo: monto ? (body.metodo ?? "tarjeta") : "gratuito",
        estado: "pagado", numero_comprobante: `CMP-DEMO-${String(datos.ultimo).padStart(6, "0")}`,
        pagado_en: ahora(), creado_en: ahora(),
      };
      datos.pagos.push(pago);
      if (inscripcion.estado === "pendiente_pago") inscripcion.estado = "confirmada";
      return aceptar(pago, true);
    }
    const pago = obtener(datos.pagos, path[1]);
    if (path[2] === "comprobante") return aceptar(comprobante(datos, pago));
    return aceptar(pago);
  }
  if (path[0] === "acreditaciones" && metodo === "POST") {
    const codigo = body.codigo.trim().toUpperCase();
    const inscripcion = datos.inscripciones.find((i) => i.codigo === codigo);
    const evento = inscripcion ? obtener(datos.eventos, inscripcion.evento_id) : null;
    const usuario = inscripcion ? obtener(datos.usuarios, inscripcion.usuario_id) : null;
    let resultado = "acreditado";
    if (!inscripcion) resultado = "codigo_invalido";
    else if (inscripcion.estado === "acreditada") resultado = "duplicado";
    else if (inscripcion.estado === "cancelada") resultado = "cancelada";
    else if (evento.estado !== "publicado") resultado = "evento_no_publicado";
    else if (inscripcion.estado === "pendiente_pago") resultado = "sin_pago";
    if (resultado === "acreditado") {
      inscripcion.estado = "acreditada";
      inscripcion.acreditada_en = ahora();
    }
    datos.registros.unshift({
      id: String(++datos.ultimo), codigo, resultado,
      puerta: body.puerta ?? "principal",
      evento_id: evento?.id ?? null, inscripcion_id: inscripcion?.id ?? null,
      ocurrido_en: ahora(), detalle: usuario ? { asistente: usuario.nombre } : {},
    });
    const mensajes = {
      acreditado: "Acreditación registrada en esta demostración.",
      duplicado: "La entrada ya fue acreditada.",
      cancelada: "La inscripción está cancelada.",
      evento_no_publicado: "El evento no está publicado.",
      codigo_invalido: "El código no existe en esta demostración.",
      sin_pago: "El pago simulado está pendiente.",
    };
    return aceptar({
      resultado, mensaje: mensajes[resultado], codigo,
      inscripcion_id: inscripcion?.id ?? null,
      asistente: usuario?.nombre ?? null, evento: evento?.nombre ?? null,
      acreditada_en: inscripcion?.acreditada_en ?? null,
    }, true);
  }
  if (path[0] === "registros-acceso") {
    return aceptar(datos.registros.filter((x) => !q.get("evento_id") || x.evento_id === Number(q.get("evento_id"))).slice(0, Number(q.get("limite") ?? 100)));
  }
  if (path[0] === "indicadores") return aceptar(indicadores(datos));
  fallo("Esta operación no está disponible en el modo demostración.", "no_disponible", 404);
}
