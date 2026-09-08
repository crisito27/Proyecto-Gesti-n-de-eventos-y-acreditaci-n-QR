/* =========================================================
   app.js
   Lógica de la aplicación: manipulación del DOM, eventos,
   validación de formularios y "estado" en memoria.
   No hay backend: cada función lee/escribe directamente
   sobre los arrays definidos en data.js.
   ========================================================= */

// -------- Helpers cortos para no repetir document.querySelector --------
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

// Id de la inscripción que se muestra en "Mi entrada" (simulación de sesión
// de un único usuario, ya que el proyecto no requiere autenticación real).
let inscripcionActualId = null;

/* =========================================================
   1. NAVEGACIÓN ENTRE VISTAS
   ========================================================= */

function cambiarVista(nombreVista) {
  $$(".vista").forEach(seccion => seccion.classList.add("d-none"));
  $(`#vista-${nombreVista}`).classList.remove("d-none");

  $$(".btn-vista").forEach(boton => {
    boton.classList.toggle("active", boton.dataset.vista === nombreVista);
  });

  // Si entramos a la vista "organizador" o "eventos", refrescamos sus datos.
  if (nombreVista === "organizador") {
    renderDashboard();
  }
}

function cambiarSubvistaOrganizador(nombreSubvista) {
  $$(".subvista").forEach(div => div.classList.add("d-none"));
  $(`#organizador-${nombreSubvista}`).classList.remove("d-none");

  $$(".btn-subvista").forEach(boton => {
    boton.classList.toggle("active", boton.dataset.subvista === nombreSubvista);
  });

  if (nombreSubvista === "dashboard") {
    renderDashboard();
  }
}

// Delegación de eventos: cualquier botón/enlace con data-vista cambia de vista.
document.addEventListener("click", (evento) => {
  const botonVista = evento.target.closest("[data-vista]");
  if (botonVista) {
    evento.preventDefault();
    cambiarVista(botonVista.dataset.vista);
  }

  const botonSubvista = evento.target.closest("[data-subvista]");
  if (botonSubvista) {
    cambiarSubvistaOrganizador(botonSubvista.dataset.subvista);
  }
});

/* =========================================================
   2. RENDERIZADO DE EVENTOS (listado público)
   ========================================================= */

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO + "T00:00:00");
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

function crearTarjetaEvento(evento) {
  const plantilla = $("#template-tarjeta-evento");
  const nodo = plantilla.content.cloneNode(true);
  const tarjeta = $(".card-evento", nodo);

  const cuposRestantes = evento.aforoMax - evento.aforoActual;
  const agotado = cuposRestantes <= 0;

  $(".badge-categoria", nodo).textContent = evento.categoria;
  $(".card-evento-nombre", nodo).textContent = evento.nombre;
  $(".card-evento-desc", nodo).textContent = evento.descripcion;
  $(".dato-fecha", nodo).textContent = formatearFecha(evento.fecha);
  $(".dato-lugar", nodo).textContent = evento.lugar;
  $(".dato-organizador", nodo).textContent = evento.organizador;

  $(".stub-aforo-numero", nodo).textContent = agotado ? "0" : cuposRestantes;
  $(".stub-aforo-label", nodo).textContent = agotado ? "agotado" : "cupos";

  const botonInscribirse = $(".btn-inscribirse", nodo);
  if (agotado) {
    tarjeta.classList.add("agotado");
    botonInscribirse.textContent = "Agotado";
    botonInscribirse.disabled = true;
  } else {
    botonInscribirse.addEventListener("click", () => abrirModalInscripcion(evento.id));
  }

  return nodo;
}

function renderEventos(listaEventos) {
  const grid = $("#grid-eventos");
  grid.innerHTML = "";

  listaEventos.forEach(evento => grid.appendChild(crearTarjetaEvento(evento)));

  const contador = $("#contador-resultados");
  contador.textContent = listaEventos.length === 0
    ? "No se encontraron eventos con esos filtros."
    : `${listaEventos.length} evento(s) encontrado(s).`;
}

/* =========================================================
   3. FILTROS (búsqueda por texto, categoría y disponibilidad)
   ========================================================= */

function aplicarFiltros() {
  const texto = $("#buscar-evento").value.trim().toLowerCase();
  const categoria = $("#filtro-categoria").value;
  const disponibilidad = $("#filtro-disponibilidad").value;

  const resultado = eventos.filter(evento => {
    const coincideTexto = !texto
      || evento.nombre.toLowerCase().includes(texto)
      || evento.lugar.toLowerCase().includes(texto);

    const coincideCategoria = !categoria || evento.categoria === categoria;

    const cuposRestantes = evento.aforoMax - evento.aforoActual;
    const coincideDisponibilidad =
      !disponibilidad ||
      (disponibilidad === "disponible" && cuposRestantes > 0) ||
      (disponibilidad === "agotado" && cuposRestantes <= 0);

    return coincideTexto && coincideCategoria && coincideDisponibilidad;
  });

  renderEventos(resultado);
}

["input", "change"].forEach(tipoEvento => {
  $("#form-filtros").addEventListener(tipoEvento, aplicarFiltros);
});
$("#form-filtros").addEventListener("reset", () => setTimeout(aplicarFiltros, 0));

/* =========================================================
   4. INSCRIPCIÓN (modal + validación + generación de QR)
   ========================================================= */

const modalInscripcion = new bootstrap.Modal("#modalInscripcion");

function abrirModalInscripcion(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  $("#inscripcion-evento-id").value = eventoId;
  $("#modal-evento-info").textContent = `${evento.nombre} — ${formatearFecha(evento.fecha)}`;

  const formulario = $("#form-inscripcion");
  formulario.reset();
  formulario.classList.remove("was-validated");

  modalInscripcion.show();
}

function generarCodigoQR() {
  const azar = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVQR-${Date.now().toString(36).toUpperCase()}-${azar}`;
}

$("#form-inscripcion").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const formulario = evento.target;

  // Validación nativa de HTML5 + estilos de Bootstrap (needs-validation).
  if (!formulario.checkValidity()) {
    formulario.classList.add("was-validated");
    return;
  }

  const eventoId = Number($("#inscripcion-evento-id").value);
  const eventoSeleccionado = eventos.find(e => e.id === eventoId);

  // -- Crear participante --
  const nuevoParticipante = {
    id: siguienteIdParticipante++,
    nombre: $("#inscripcion-nombre").value.trim(),
    email: $("#inscripcion-email").value.trim(),
    telefono: $("#inscripcion-telefono").value.trim()
  };
  participantes.push(nuevoParticipante);

  // -- Crear inscripción / entrada con QR único --
  const nuevaInscripcion = {
    id: siguienteIdInscripcion++,
    eventoId: eventoSeleccionado.id,
    participanteId: nuevoParticipante.id,
    codigoQR: generarCodigoQR(),
    estado: "inscrito"
  };
  inscripciones.push(nuevaInscripcion);

  // -- Actualizar aforo del evento --
  eventoSeleccionado.aforoActual += 1;

  inscripcionActualId = nuevaInscripcion.id;

  modalInscripcion.hide();
  aplicarFiltros();          // refresca el listado (cupos actualizados)
  renderTicketActual();      // arma la vista "Mi entrada"
  cambiarVista("mientrada");
});

/* =========================================================
   5. MI ENTRADA (ticket con QR real)
   ========================================================= */

function renderTicketActual() {
  const contenedor = $("#contenedor-mientrada");

  if (!inscripcionActualId) {
    contenedor.innerHTML = `
      <div class="empty-state text-center py-5" id="mientrada-vacia">
        <i class="bi bi-ticket-perforated display-4 text-muted"></i>
        <p class="mt-3 text-muted">Aún no tienes una entrada. Inscríbete en un evento para generar tu código QR.</p>
        <button class="btn btn-primary-brand" data-vista="eventos" type="button">Ver eventos disponibles</button>
      </div>`;
    return;
  }

  contenedor.innerHTML = "";

  const inscripcion = inscripciones.find(i => i.id === inscripcionActualId);
  const evento = eventos.find(e => e.id === inscripcion.eventoId);
  const participante = participantes.find(p => p.id === inscripcion.participanteId);

  const plantilla = $("#template-ticket");
  const nodo = plantilla.content.cloneNode(true);

  $(".ticket-evento-nombre", nodo).textContent = evento.nombre;
  $(".ticket-participante", nodo).textContent = `Inscrito por: ${participante.nombre}`;
  $(".dato-fecha", nodo).textContent = formatearFecha(evento.fecha);
  $(".dato-lugar", nodo).textContent = evento.lugar;
  $(".ticket-codigo", nodo).textContent = inscripcion.codigoQR;

  const badgeEstado = $(".ticket-estado", nodo);
  if (inscripcion.estado === "asistio") {
    badgeEstado.textContent = "Asistencia registrada";
    badgeEstado.classList.add("text-bg-success");
  } else {
    badgeEstado.textContent = "Inscrito — pendiente de check-in";
    badgeEstado.classList.add("text-bg-warning");
  }

  const botonCertificado = $(".btn-certificado", nodo);
  botonCertificado.disabled = inscripcion.estado !== "asistio";
  botonCertificado.addEventListener("click", () => generarCertificadoPDF(inscripcion));

  contenedor.appendChild(nodo);

  // Generar el código QR real dentro del contenedor recién insertado.
  new QRCode($(".ticket-qr"), {
    text: inscripcion.codigoQR,
    width: 120,
    height: 120
  });
}

/* =========================================================
   6. CHECK-IN (vista organizador)
   ========================================================= */

$("#btn-buscar-codigo").addEventListener("click", buscarCodigoCheckin);
$("#input-codigo-checkin").addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    buscarCodigoCheckin();
  }
});

function buscarCodigoCheckin() {
  const codigo = $("#input-codigo-checkin").value.trim().toUpperCase();
  const resultado = $("#resultado-checkin");
  resultado.innerHTML = "";

  if (!codigo) {
    resultado.innerHTML = `<div class="alert alert-warning">Ingresa un código para buscar.</div>`;
    return;
  }

  const inscripcion = inscripciones.find(i => i.codigoQR === codigo);

  if (!inscripcion) {
    resultado.innerHTML = `<div class="alert alert-danger">No se encontró ninguna entrada con ese código.</div>`;
    return;
  }

  const evento = eventos.find(e => e.id === inscripcion.eventoId);
  const participante = participantes.find(p => p.id === inscripcion.participanteId);

  if (inscripcion.estado === "asistio") {
    resultado.innerHTML = `
      <div class="alert alert-info">
        <strong>${participante.nombre}</strong> ya registró su asistencia a "${evento.nombre}".
      </div>`;
    return;
  }

  const divResultado = document.createElement("div");
  divResultado.className = "alert alert-secondary";
  divResultado.innerHTML = `
    <p class="mb-1"><strong>${participante.nombre}</strong> — ${participante.email}</p>
    <p class="mb-2 text-muted">${evento.nombre}</p>
  `;

  const botonConfirmar = document.createElement("button");
  botonConfirmar.className = "btn btn-primary-brand btn-sm";
  botonConfirmar.textContent = "Confirmar asistencia";
  botonConfirmar.addEventListener("click", () => confirmarAsistencia(inscripcion.id));

  divResultado.appendChild(botonConfirmar);
  resultado.appendChild(divResultado);
}

function confirmarAsistencia(inscripcionId) {
  const inscripcion = inscripciones.find(i => i.id === inscripcionId);
  inscripcion.estado = "asistio";

  $("#input-codigo-checkin").value = "";
  $("#resultado-checkin").innerHTML = `<div class="alert alert-success">Asistencia registrada correctamente.</div>`;

  renderDashboard();

  // Si la entrada marcada es la que se muestra en "Mi entrada", la actualizamos.
  if (inscripcionActualId === inscripcionId) {
    renderTicketActual();
  }
}

/* =========================================================
   7. DASHBOARD EN VIVO (vista organizador)
   ========================================================= */

function renderDashboard() {
  const grid = $("#grid-dashboard");
  grid.innerHTML = "";

  eventos.forEach(evento => {
    const inscritosEvento = inscripciones.filter(i => i.eventoId === evento.id);
    const asistieron = inscritosEvento.filter(i => i.estado === "asistio").length;
    const restantes = evento.aforoMax - evento.aforoActual;
    const porcentaje = Math.round((evento.aforoActual / evento.aforoMax) * 100);

    const plantilla = $("#template-tarjeta-dashboard");
    const nodo = plantilla.content.cloneNode(true);

    $(".dash-nombre", nodo).textContent = evento.nombre;
    $(".dash-fecha", nodo).textContent = formatearFecha(evento.fecha);
    $(".dash-inscritos", nodo).textContent = evento.aforoActual;
    $(".dash-asistieron", nodo).textContent = asistieron;
    $(".dash-restantes", nodo).textContent = Math.max(restantes, 0);

    const barra = $(".dash-barra", nodo);
    barra.style.width = `${Math.min(porcentaje, 100)}%`;
    barra.setAttribute("aria-valuenow", porcentaje);
    barra.setAttribute("aria-valuemin", 0);
    barra.setAttribute("aria-valuemax", 100);

    if (porcentaje >= 100) {
      barra.classList.add("aforo-lleno");
    } else if (porcentaje >= 75) {
      barra.classList.add("aforo-alto");
    }

    grid.appendChild(nodo);
  });
}

/* =========================================================
   8. CERTIFICADO PDF (extensión)
   ========================================================= */

function generarCertificadoPDF(inscripcion) {
  const evento = eventos.find(e => e.id === inscripcion.eventoId);
  const participante = participantes.find(p => p.id === inscripcion.participanteId);

  const { jsPDF } = window.jspdf;
  const documento = new jsPDF({ orientation: "landscape" });

  documento.setFontSize(26);
  documento.text("Certificado de Participación", 148, 50, { align: "center" });

  documento.setFontSize(16);
  documento.text(`Se certifica que`, 148, 75, { align: "center" });

  documento.setFontSize(22);
  documento.text(participante.nombre, 148, 90, { align: "center" });

  documento.setFontSize(16);
  documento.text(`participó en "${evento.nombre}"`, 148, 105, { align: "center" });
  documento.text(`realizado el ${formatearFecha(evento.fecha)} en ${evento.lugar}.`, 148, 115, { align: "center" });

  documento.setFontSize(11);
  documento.text(`Código de entrada: ${inscripcion.codigoQR}`, 148, 140, { align: "center" });

  documento.save(`certificado-${participante.nombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

/* =========================================================
   9. INICIALIZACIÓN
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  aplicarFiltros();
  renderTicketActual();
  renderDashboard();
});
