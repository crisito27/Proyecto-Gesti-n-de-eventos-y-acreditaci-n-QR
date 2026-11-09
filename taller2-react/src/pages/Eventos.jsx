/* Eventos — vista pública del catálogo.

   Cambio del Hito 3: el filtrado por texto y categoría ya no se
   hace sobre un array en memoria, sino que viaja como parámetros
   de consulta a la API. Sólo el filtro de disponibilidad se
   resuelve en el cliente, porque opera sobre `cupos_disponibles`,
   que es un dato ya calculado por el backend en la respuesta. */

import { useState } from "react";
import FiltrosEventos from "../components/FiltrosEventos";
import ListaEventos from "../components/ListaEventos";
import { Recurso } from "../components/EstadoRecurso";
import { useRecurso } from "../hooks/useRecurso";
import { listarEventos } from "../services/eventosApi";

const FILTROS_INICIALES = { texto: "", categoriaId: "", disponibilidad: "" };

function Eventos({ categorias, onInscribirse, onVerDetalle, recargarToken }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const { datos, cargando, error, recargar } = useRecurso(
    () =>
      listarEventos({
        texto: filtros.texto.trim() || undefined,
        categoriaId: filtros.categoriaId || undefined,
        estado: "publicado", // el público sólo ve eventos publicados
      }),
    [filtros.texto, filtros.categoriaId, recargarToken],
    { inicial: [] },
  );

  const visibles = (datos ?? []).filter((evento) => {
    if (filtros.disponibilidad === "disponible") return !evento.agotado;
    if (filtros.disponibilidad === "agotado") return evento.agotado;
    return true;
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
          categorias={categorias}
          onCambiarFiltros={setFiltros}
          onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        />
      </div>

      <Recurso cargando={cargando} error={error} onReintentar={recargar}>
        <ListaEventos
          eventos={visibles}
          onInscribirse={onInscribirse}
          onVerDetalle={onVerDetalle}
        />
      </Recurso>
    </section>
  );
}

export default Eventos;
