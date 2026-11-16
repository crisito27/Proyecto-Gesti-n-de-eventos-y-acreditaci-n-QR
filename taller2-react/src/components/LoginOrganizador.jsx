/* Inicio de sesión real contra FastAPI; nunca guarda la contraseña. */
import { useState } from "react";
import { api } from "../services/apiCliente";

export default function LoginOrganizador({ onIngreso }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const sesion = await api.post("/auth/login", { email, clave });
      if (sesion.usuario.rol !== "organizador") {
        throw new Error("Esta cuenta no tiene un perfil de organizador.");
      }
      onIngreso(sesion);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
      setClave("");
    }
  }
  return (
    <section className="card-panel p-4 mx-auto" style={{ maxWidth: "460px" }}>
      <h1 className="h4 mb-2">Acceso del organizador</h1>
      <p className="small text-muted">Inicia sesión para administrar eventos, acreditar entradas y consultar la bitácora.</p>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={enviar}>
        <label className="form-label" htmlFor="login-email">Correo</label>
        <input className="form-control mb-3" id="login-email" type="email" required autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="form-label" htmlFor="login-clave">Contraseña</label>
        <input className="form-control mb-3" id="login-clave" type="password" required autoComplete="current-password"
          value={clave} onChange={(e) => setClave(e.target.value)} />
        <button className="btn btn-primary-brand w-100" disabled={cargando} type="submit">
          {cargando ? "Comprobando..." : "Ingresar"}
        </button>
      </form>
      <p className="small text-muted mt-3 mb-0">Las cuentas del organizador se habilitan desde el servidor; no existe alta pública de administradores.</p>
    </section>
  );
}
