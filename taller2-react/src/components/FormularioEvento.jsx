/* FormularioEvento — alta y edición de eventos.

   Sirve para los dos casos: si recibe `evento`, edita; si no,
   crea. Es el mismo formulario porque los campos son los mismos y
   duplicarlo obligaría a mantener dos copias. */

import { useState } from "react";

const VACIO = {
  organizador_id: "",
  categoria_id: "",
  nombre: "",
  descripcion: "",
  fecha: "",
  lugar: "",
  latitud: "",
  longitud: "",
  exterior: false,
  aforo_max: 50,
  precio: 0,
};

function desdeEvento(evento) {
  if (!evento) return VACIO;
  return {
    organizador_id: evento.organizador_id,
    categoria_id: evento.categoria_id,
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fecha: evento.fecha,
    lugar: evento.lugar,
    latitud: evento.latitud ?? "",
    longitud: evento.longitud ?? "",
    exterior: evento.exterior,
    aforo_max: evento.aforo_max,
    precio: Number(evento.precio),
  };
}

function FormularioEvento({ evento, categorias, organizadores, onGuardar, onCerrar }) {
  const editando = Boolean(evento);
  const [formulario, setFormulario] = useState(() => desdeEvento(evento));
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function actualizar(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor });
  }

  function validar() {
    const nuevos = {};
    if (!editando && !formulario.organizador_id) nuevos.organizador_id = "Elige un organizador.";
    if (!formulario.categoria_id) nuevos.categoria_id = "Elige una categoría.";
    if (formulario.nombre.trim().length < 5) nuevos.nombre = "Mínimo 5 caracteres.";
    if (!formulario.fecha) nuevos.fecha = "Indica la fecha del evento.";
    if (formulario.lugar.trim().length < 3) nuevos.lugar = "Indica el lugar.";
    if (Number(formulario.aforo_max) <= 0) nuevos.aforo_max = "El aforo debe ser mayor que cero.";
    if (Number(formulario.precio) < 0) nuevos.precio = "El precio no puede ser negativo.";
    return nuevos;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setErrorServidor(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      categoria_id: Number(formulario.categoria_id),
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      fecha: formulario.fecha,
      lugar: formulario.lugar.trim(),
      latitud: formulario.latitud === "" ? null : Number(formulario.latitud),
      longitud: formulario.longitud === "" ? null : Number(formulario.longitud),
      exterior: formulario.exterior,
      aforo_max: Number(formulario.aforo_max),
      precio: String(Number(formulario.precio).toFixed(2)),
    };

    if (!editando) datos.organizador_id = Number(formulario.organizador_id);

    setGuardando(true);
    try {
      await onGuardar(datos);
    } catch (fallo) {
      setErrorServidor(fallo);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-form-evento">
      <div className="modal-caja">
        <div className="modal-cabecera">
          <h2 id="titulo-form-evento" className="h5 mb-0">
            {editando ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
        </div>

        <div className="modal-cuerpo">
          {errorServidor && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-1"></i>
              {errorServidor.message}
            </div>
          )}

          <form onSubmit={manejarEnvio} noValidate>
            {!editando && (
              <div className="mb-3">
                <label htmlFor="ev-organizador" className="form-label">
                  Organizador
                </label>
                <select
                  id="ev-organizador"
                  className={"form-select" + (errores.organizador_id ? " is-invalid" : "")}
                  value={formulario.organizador_id}
                  onChange={(e) => actualizar("organizador_id", e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {organizadores.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre_organizacion}
                    </option>
                  ))}
                </select>
                {errores.organizador_id && (
                  <div className="invalid-feedback">{errores.organizador_id}</div>
                )}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="ev-nombre" className="form-label">
                Nombre del evento
              </label>
              <input
                type="text"
                id="ev-nombre"
                className={"form-control" + (errores.nombre ? " is-invalid" : "")}
                value={formulario.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="ev-descripcion" className="form-label">
                Descripción
              </label>
              <textarea
                id="ev-descripcion"
                className="form-control"
                rows={3}
                value={formulario.descripcion}
                onChange={(e) => actualizar("descripcion", e.target.value)}
              />
              <div className="form-text">
                Obligatoria para publicar el evento.
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label htmlFor="ev-categoria" className="form-label">
                  Categoría
                </label>
                <select
                  id="ev-categoria"
                  className={"form-select" + (errores.categoria_id ? " is-invalid" : "")}
                  value={formulario.categoria_id}
                  onChange={(e) => actualizar("categoria_id", e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {errores.categoria_id && (
                  <div className="invalid-feedback">{errores.categoria_id}</div>
                )}
              </div>

              <div className="col-12 col-sm-6">
                <label htmlFor="ev-fecha" className="form-label">
                  Fecha
                </label>
                <input
                  type="date"
                  id="ev-fecha"
                  className={"form-control" + (errores.fecha ? " is-invalid" : "")}
                  value={formulario.fecha}
                  onChange={(e) => actualizar("fecha", e.target.value)}
                />
                {errores.fecha && <div className="invalid-feedback">{errores.fecha}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="ev-lugar" className="form-label">
                Lugar
              </label>
              <input
                type="text"
                id="ev-lugar"
                className={"form-control" + (errores.lugar ? " is-invalid" : "")}
                value={formulario.lugar}
                onChange={(e) => actualizar("lugar", e.target.value)}
              />
              {errores.lugar && <div className="invalid-feedback">{errores.lugar}</div>}
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label htmlFor="ev-lat" className="form-label">
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="ev-lat"
                  className="form-control"
                  placeholder="-33.0245"
                  value={formulario.latitud}
                  onChange={(e) => actualizar("latitud", e.target.value)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="ev-lon" className="form-label">
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.0001"
                  id="ev-lon"
                  className="form-control"
                  placeholder="-71.5518"
                  value={formulario.longitud}
                  onChange={(e) => actualizar("longitud", e.target.value)}
                />
              </div>
              <div className="col-12">
                <div className="form-text">
                  Las coordenadas habilitan el pronóstico del tiempo para ese día.
                </div>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label htmlFor="ev-aforo" className="form-label">
                  Aforo máximo
                </label>
                <input
                  type="number"
                  min="1"
                  id="ev-aforo"
                  className={"form-control" + (errores.aforo_max ? " is-invalid" : "")}
                  value={formulario.aforo_max}
                  onChange={(e) => actualizar("aforo_max", e.target.value)}
                />
                {errores.aforo_max && <div className="invalid-feedback">{errores.aforo_max}</div>}
              </div>
              <div className="col-6">
                <label htmlFor="ev-precio" className="form-label">
                  Precio (CLP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  id="ev-precio"
                  className={"form-control" + (errores.precio ? " is-invalid" : "")}
                  value={formulario.precio}
                  onChange={(e) => actualizar("precio", e.target.value)}
                />
                {errores.precio && <div className="invalid-feedback">{errores.precio}</div>}
                <div className="form-text">0 = evento gratuito</div>
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="ev-exterior"
                checked={formulario.exterior}
                onChange={(e) => actualizar("exterior", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="ev-exterior">
                El evento es al aire libre
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary-brand" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FormularioEvento;
