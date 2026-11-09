/* ClimaEvento — pronóstico del día del evento.

   Cambio del Hito 3: antes este componente llamaba directamente a
   Open-Meteo desde el navegador y traducía los códigos WMO aquí.
   Ahora pide `/eventos/{id}/clima` al backend, que es quien
   conoce las coordenadas del evento y conversa con la API pública.

   Se mantienen los cuatro estados: cargando, error, sin datos y
   datos disponibles. */

import { useRecurso } from "../hooks/useRecurso";
import { obtenerClima } from "../services/eventosApi";

function ClimaEvento({ eventoId }) {
  const { datos, cargando, error } = useRecurso(
    () => obtenerClima(eventoId),
    [eventoId],
  );

  if (cargando) {
    return (
      <div className="clima-caja text-muted small">
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Consultando el pronóstico del tiempo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="clima-caja small text-danger">
        <i className="bi bi-exclamation-triangle me-1"></i>
        No se pudo obtener el pronóstico. Puedes inscribirte igualmente.
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="clima-caja small text-muted">
        <i className="bi bi-info-circle me-1"></i>
        El pronóstico todavía no está disponible para esta fecha.
      </div>
    );
  }

  return (
    <div className="clima-caja">
      <p className="small text-muted mb-1">
        <i className="bi bi-cloud-sun me-1"></i>
        Pronóstico para el día del evento
      </p>
      <p className="mb-0">
        <span className="clima-temp">
          {Math.round(datos.temp_min)}° / {Math.round(datos.temp_max)}°C
        </span>
        <span className="text-muted ms-2">{datos.descripcion}</span>
      </p>
    </div>
  );
}

export default ClimaEvento;
