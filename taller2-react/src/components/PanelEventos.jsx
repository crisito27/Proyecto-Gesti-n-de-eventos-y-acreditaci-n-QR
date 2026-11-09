/* PanelEventos — administración de eventos del organizador.

   Cubre el ciclo completo: crear, editar, publicar, cancelar y
   eliminar. Cada acción llama a la API y recarga la lista, de modo
   que lo que se ve en pantalla siempre refleja lo que hay en la
   base de datos. */

import { useState } from "react";
import FormularioEvento from "./FormularioEvento";
import { Recurso } from "./EstadoRecurso";
import { useRecurso } from "../hooks/useRecurso";
import {
  actualizarEvento,
  cancelarEvento,
  crearEvento,
  eliminarEvento,
  listarEventos,
  publicarEvento,
} from "../services/eventosApi";
import { ETIQUETA_ESTADO_EVENTO, formatearFecha, formatearPrecio } from "../utils/formato";

const CLASE_ESTADO = {
  borrador: "text-bg-secondary",
  publicado: "text-bg-success",
  cancelado: "text-bg-danger",
};

function PanelEventos({ categorias, organizadores, onCambio }) {
  const [version, setVersion] = useState(0);
  const { datos: eventos, cargando, error, recargar } = useRecurso(
    () => listarEventos(),
    [version],
    { inicial: [] },
  );

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  function refrescar() {
    setVersion((v) => v + 1);
    onCambio?.();
  }

  async function guardar(datos) {
    if (eventoEditando) {
      await actualizarEvento(eventoEditando.id, datos);
      setAviso({ tipo: "success", texto: "Evento actualizado." });
    } else {
      await crearEvento(datos);
      setAviso({ tipo: "success", texto: "Evento creado en estado borrador." });
    }
    setFormularioAbierto(false);
    setEventoEditando(null);
    refrescar();
  }

  async function ejecutar(accion, mensajeOk) {
    setAviso(null);
    try {
      await accion();
      setAviso({ tipo: "success", texto: mensajeOk });
      refrescar();
    } catch (fallo) {
      setAviso({ tipo: "danger", texto: fallo.message });
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="h5 mb-0">Mis eventos</h2>
        <button
          type="button"
          className="btn btn-sm btn-primary-brand"
          onClick={() => {
            setEventoEditando(null);
            setFormularioAbierto(true);
          }}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo evento
        </button>
      </div>

      {aviso && (
        <div className={`alert alert-${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}

      <Recurso
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={eventos?.length === 0}
        mensajeVacio="Todavía no has creado ningún evento."
      >
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th scope="col">Evento</th>
                <th scope="col">Fecha</th>
                <th scope="col">Estado</th>
                <th scope="col">Aforo</th>
                <th scope="col">Valor</th>
                <th scope="col" className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos?.map((evento) => (
                <tr key={evento.id}>
                  <td>
                    <div className="fw-semibold">{evento.nombre}</div>
                    <div className="text-muted small">{evento.lugar}</div>
                  </td>
                  <td className="small">{formatearFecha(evento.fecha)}</td>
                  <td>
                    <span className={"badge " + (CLASE_ESTADO[evento.estado] ?? "")}>
                      {ETIQUETA_ESTADO_EVENTO[evento.estado] ?? evento.estado}
                    </span>
                  </td>
                  <td className="small">
                    {evento.inscritos} / {evento.aforo_max}
                  </td>
                  <td className="small">{formatearPrecio(evento.precio)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        title="Editar"
                        onClick={() => {
                          setEventoEditando(evento);
                          setFormularioAbierto(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      {evento.estado === "borrador" && (
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Publicar"
                          onClick={() =>
                            ejecutar(
                              () => publicarEvento(evento.id),
                              `"${evento.nombre}" fue publicado.`,
                            )
                          }
                        >
                          <i className="bi bi-megaphone"></i>
                        </button>
                      )}

                      {evento.estado !== "cancelado" && (
                        <button
                          type="button"
                          className="btn btn-outline-warning"
                          title="Cancelar"
                          onClick={() =>
                            ejecutar(
                              () => cancelarEvento(evento.id),
                              `"${evento.nombre}" fue cancelado.`,
                            )
                          }
                        >
                          <i className="bi bi-slash-circle"></i>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        title="Eliminar"
                        onClick={() =>
                          ejecutar(
                            () => eliminarEvento(evento.id),
                            `"${evento.nombre}" fue eliminado.`,
                          )
                        }
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-muted small">
          Un evento se crea en borrador y no acepta inscripciones hasta publicarse.
          Eliminar sólo es posible si no tiene inscritos; si los tiene, corresponde cancelarlo.
        </p>
      </Recurso>

      {formularioAbierto && (
        <FormularioEvento
          evento={eventoEditando}
          categorias={categorias}
          organizadores={organizadores}
          onGuardar={guardar}
          onCerrar={() => {
            setFormularioAbierto(false);
            setEventoEditando(null);
          }}
        />
      )}
    </section>
  );
}

export default PanelEventos;
