/* =========================================================
   useRecurso — hook para cargar datos desde la API.

   Cada pantalla que consulta el backend necesita lo mismo:
   un indicador de carga, el manejo del error y una forma de
   recargar. Tenerlo en un hook evita repetir ese useEffect en
   cada componente.
   ========================================================= */

import { useCallback, useEffect, useState } from "react";

/**
 * @param {Function} consulta  función async que devuelve los datos
 * @param {Array}    depende   dependencias que disparan una recarga
 * @param {Object}   opciones  { inicial, activo }
 */
export function useRecurso(consulta, depende = [], opciones = {}) {
  const { inicial = null, activo = true } = opciones;

  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(activo);
  const [error, setError] = useState(null);

  // La lista depende del contrato del hook: cada consumidor entrega sus
  // dependencias explícitas para invalidar la consulta.
  const ejecutar = useCallback(async (señal) => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await consulta();
      // No se actualiza el estado si el componente ya se desmontó o si
      // llegó una consulta más nueva: evita avisos de React y resultados
      // que se pisan entre sí.
      if (!señal?.cancelado) setDatos(resultado);
    } catch (fallo) {
      if (!señal?.cancelado) setError(fallo);
    } finally {
      if (!señal?.cancelado) setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/use-memo
  }, depende);

  useEffect(() => {
    if (!activo) return undefined;
    const señal = { cancelado: false };
    ejecutar(señal);
    return () => {
      señal.cancelado = true;
    };
  }, [ejecutar, activo]);

  /** Vuelve a consultar: se usa tras crear, editar o eliminar algo. */
  const recargar = useCallback(() => ejecutar(), [ejecutar]);

  return { datos, cargando, error, recargar, setDatos };
}
