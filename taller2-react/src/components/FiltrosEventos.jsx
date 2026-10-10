/* FiltrosEventos — formulario de búsqueda y filtros.
   Todos los campos son "controlados": su valor viene de props y
   cada cambio avisa al padre. React es la única fuente de verdad. */

function FiltrosEventos({ filtros, onCambiarFiltros, onLimpiar }) {
  function actualizar(campo, valor) {
    onCambiarFiltros({ ...filtros, [campo]: valor });
  }

  return (
    <form className="row g-2 filtros-form" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="col-12 col-md-5">
        <label htmlFor="buscar-evento" className="form-label visually-hidden">
          Buscar evento
        </label>
        <input
          type="search"
          id="buscar-evento"
          className="form-control"
          placeholder="Buscar por nombre o lugar..."
          value={filtros.texto}
          onChange={(e) => actualizar("texto", e.target.value)}
        />
      </div>

      <div className="col-6 col-md-3">
        <label htmlFor="filtro-categoria" className="form-label visually-hidden">
          Categoría
        </label>
        <select
          id="filtro-categoria"
          className="form-select"
          value={filtros.categoria}
          onChange={(e) => actualizar("categoria", e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="Seminario">Seminario</option>
          <option value="Capacitación">Capacitación</option>
          <option value="Feria">Feria</option>
          <option value="Taller">Taller</option>
        </select>
      </div>

      <div className="col-6 col-md-3">
        <label htmlFor="filtro-disponibilidad" className="form-label visually-hidden">
          Disponibilidad
        </label>
        <select
          id="filtro-disponibilidad"
          className="form-select"
          value={filtros.disponibilidad}
          onChange={(e) => actualizar("disponibilidad", e.target.value)}
        >
          <option value="">Todos</option>
          <option value="disponible">Con cupos</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      <div className="col-12 col-md-1 d-grid">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onLimpiar}
          title="Limpiar filtros"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </form>
  );
}

export default FiltrosEventos;
