/* FiltrosEventos — buscador y filtros.

   Las categorías ya no están escritas a mano: se cargan desde la
   API, de modo que si el organizador crea una nueva, aparece aquí
   sin tocar el código. */

function FiltrosEventos({ filtros, categorias, onCambiarFiltros, onLimpiar }) {
  function actualizar(campo, valor) {
    onCambiarFiltros({ ...filtros, [campo]: valor });
  }

  return (
    <form
      className="row g-2 filtros-form"
      role="search"
      onSubmit={(e) => e.preventDefault()}
    >
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
          value={filtros.categoriaId}
          onChange={(e) => actualizar("categoriaId", e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
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
          aria-label="Limpiar filtros"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </form>
  );
}

export default FiltrosEventos;
