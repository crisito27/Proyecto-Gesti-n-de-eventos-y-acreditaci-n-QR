/* Eventos — vista pública.
   Guarda el estado de los filtros y calcula la lista filtrada.
   El filtrado se hace en el renderizado: no hace falta guardar la
   lista resultante en estado, porque se deriva de lo que ya hay. */

import { useState } from "react";
import FiltrosEventos from "../components/FiltrosEventos";
import ListaEventos from "../components/ListaEventos";

const FILTROS_INICIALES = { texto: "", categoria: "", disponibilidad: "" };

function Eventos({ eventos, contarInscritos, onInscribirse, onVerDetalle }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const eventosFiltrados = eventos.filter((evento) => {
    const texto = filtros.texto.trim().toLowerCase();

    const coincideTexto =
      !texto ||
      evento.nombre.toLowerCase().includes(texto) ||
      evento.lugar.toLowerCase().includes(texto);

    const coincideCategoria =
      !filtros.categoria || evento.categoria === filtros.categoria;

    const cuposRestantes = evento.aforoMax - contarInscritos(evento.id);
    const coincideDisponibilidad =
      !filtros.disponibilidad ||
      (filtros.disponibilidad === "disponible" && cuposRestantes > 0) ||
      (filtros.disponibilidad === "agotado" && cuposRestantes <= 0);

    return coincideTexto && coincideCategoria && coincideDisponibilidad;
  });

  return (
    <section aria-labelledby="titulo-eventos">
      <div className="hero-eventos mb-4">
        <h1 id="titulo-eventos">Encuentra tu próximo evento</h1>
        <p className="text-muted">
          Inscríbete en seminarios, capacitaciones y ferias, y recibe tu entrada
          con código QR al instante.
        </p>

        <FiltrosEventos
          filtros={filtros}
          onCambiarFiltros={setFiltros}
          onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        />
      </div>

      <ListaEventos
        eventos={eventosFiltrados}
        contarInscritos={contarInscritos}
        onInscribirse={onInscribirse}
        onVerDetalle={onVerDetalle}
      />
    </section>
  );
}

export default Eventos;
