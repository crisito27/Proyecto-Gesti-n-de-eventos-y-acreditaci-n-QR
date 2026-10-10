/* Navbar — barra superior. Es un componente "tonto": no tiene
   estado propio, recibe por props la vista activa y la función
   que la cambia. El estado vive en App.jsx. */

const VISTAS = [
  { clave: "eventos", etiqueta: "Eventos" },
  { clave: "mientrada", etiqueta: "Mi entrada" },
  { clave: "organizador", etiqueta: "Organizador" },
];

function Navbar({ vistaActiva, onCambiarVista }) {
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
                    "nav-link btn-vista" +
                    (vistaActiva === vista.clave ? " active" : "")
                  }
                  onClick={() => onCambiarVista(vista.clave)}
                >
                  {vista.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
