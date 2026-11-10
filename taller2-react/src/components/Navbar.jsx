/* Navbar — barra superior. Componente sin estado propio: recibe
   la vista activa y la función que la cambia. */

const VISTAS = [
  { clave: "eventos", etiqueta: "Eventos" },
  { clave: "mientrada", etiqueta: "Mi entrada" },
  { clave: "organizador", etiqueta: "Organizador" },
];

function Navbar({ vistaActiva, onCambiarVista, organizador, onCerrarSesion }) {
  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-sm">
        <div className="container">
          <span className="navbar-brand mb-0">
            <i className="bi bi-qr-code-scan text-warning me-1"></i>
            AcreditaQR
          </span>

          <ul className="navbar-nav flex-row gap-1">
            {VISTAS.map((vista) => (
              <li className="nav-item" key={vista.clave}>
                <button
                  type="button"
                  className={
                    "nav-link btn-vista" + (vistaActiva === vista.clave ? " active" : "")
                  }
                  aria-current={vistaActiva === vista.clave ? "page" : undefined}
                  onClick={() => onCambiarVista(vista.clave)}
                >
                  {vista.etiqueta}
                </button>
              </li>
            ))}
          </ul>
          {organizador && (
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={onCerrarSesion}>
              Salir
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
