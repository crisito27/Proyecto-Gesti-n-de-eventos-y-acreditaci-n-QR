/* ClimaEvento — consume la API pública Open-Meteo.

   Es el único componente con useEffect, porque es el único que
   necesita sincronizarse con algo externo a React (una petición
   HTTP). Maneja tres estados posibles: cargando, error y datos.

   El array de dependencias [lat, lon, fecha] hace que la consulta
   se repita sólo si cambia el evento, no en cada renderizado. */

import { useEffect, useState } from "react";
import { obtenerClima, describirClima } from "../services/climaApi";

function ClimaEvento({ lat, lon, fecha }) {
  const [clima, setClima] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // "cancelado" evita actualizar el estado si el componente se
    // desmonta antes de que llegue la respuesta.
    let cancelado = false;

    async function consultar() {
      setCargando(true);
      setError(null);

      try {
        const datos = await obtenerClima(lat, lon, fecha);
        if (!cancelado) {
          setClima(datos);
        }
      } catch (problema) {
        if (!cancelado) {
          setError(problema.message);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    consultar();

    return () => {
      cancelado = true;
    };
  }, [lat, lon, fecha]);

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
        No se pudo obtener el pronóstico ({error}). Puedes inscribirte igualmente.
      </div>
    );
  }

  if (!clima) {
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
          {Math.round(clima.tempMin)}° / {Math.round(clima.tempMax)}°C
        </span>
        <span className="text-muted ms-2">{describirClima(clima.codigo)}</span>
      </p>
    </div>
  );
}

export default ClimaEvento;
