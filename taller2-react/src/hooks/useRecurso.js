/* useRecurso: carga y recarga sin datos operacionales locales.
 * La consulta más reciente se conserva en una ref: los componentes pueden
 * pasar funciones inline y la carga sólo se repite cuando cambian sus
 * dependencias explícitas o cuando se solicita recargar.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * @param {Function} consulta  función async que devuelve los datos
 * @param {Array}    depende   valores serializables que disparan recarga
 * @param {Object}   opciones  { inicial, activo }
 */
export function useRecurso(consulta, depende = [], opciones = {}) {
  const { inicial = null, activo = true } = opciones;

  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(activo);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const consultaActual = useRef(consulta);
  useEffect(() => {
    consultaActual.current = consulta;
  }, [consulta]);

  // Los consumidores pasan identificadores, filtros o tokens serializables,
  // no objetos complejos; así evitamos dependencias dinámicas de useCallback.
  const claveDependencias = JSON.stringify(depende);

  useEffect(() => {
    const señal = { cancelado: false };
    if (!activo) {
      return () => { señal.cancelado = true; };
    }

    // Inicia la sincronización de forma asíncrona y respeta la cancelación.
    // Evita disparar setState síncrono dentro del propio efecto.
    Promise.resolve().then(async () => {
      if (señal.cancelado) return;
      setCargando(true);
      setError(null);
      try {
        const resultado = await consultaActual.current();
        if (!señal.cancelado) setDatos(resultado);
      } catch (fallo) {
        if (!señal.cancelado) setError(fallo);
      } finally {
        if (!señal.cancelado) setCargando(false);
      }
    });

    return () => { señal.cancelado = true; };
  }, [claveDependencias, activo, version]);

  const recargar = useCallback(() => {
    setVersion((anterior) => anterior + 1);
  }, []);

  return { datos, cargando: activo && cargando, error, recargar, setDatos };
}
