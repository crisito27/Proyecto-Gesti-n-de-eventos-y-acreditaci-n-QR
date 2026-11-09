/* =========================================================
   apiCliente.js — único punto por el que la aplicación habla
   con el backend.

   Concentrar aquí el fetch tiene tres efectos:
     · la URL base se define en un solo lugar, por variable de
       entorno, y cambia sin tocar los componentes;
     · todos los errores llegan con la misma forma, porque el
       backend responde { codigo, mensaje } en cualquier fallo;
     · los componentes no saben nada de HTTP: piden datos y
       reciben objetos.
   ========================================================= */

// Vite expone las variables que empiezan con VITE_. Si no está
// definida, se asume el backend local levantado con Docker Compose.
const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

/** Error con el código estable que devuelve el backend. */
export class ErrorApi extends Error {
  constructor(mensaje, codigo, estado, causa) {
    super(mensaje, causa ? { cause: causa } : undefined);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.estado = estado;
  }
}

async function solicitar(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
  } catch (fallo) {
    // fetch sólo rechaza cuando no hubo respuesta: el servidor está
    // caído, no hay red, o CORS bloqueó la petición.
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Revisa que el backend esté levantado.",
      "sin_conexion",
      0,
      fallo,
    );
  }

  if (respuesta.status === 204) {
    return null;
  }

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Errores de dominio: { codigo, mensaje }.
    // Errores de validación de FastAPI: { detail: [...] }.
    if (cuerpo?.codigo) {
      throw new ErrorApi(cuerpo.mensaje, cuerpo.codigo, respuesta.status);
    }
    if (Array.isArray(cuerpo?.detail)) {
      const detalle = cuerpo.detail
        .map((e) => `${e.loc?.slice(1).join(".") ?? "campo"}: ${e.msg}`)
        .join(" · ");
      throw new ErrorApi(detalle, "validacion", respuesta.status);
    }
    throw new ErrorApi(
      `El servidor respondió con estado ${respuesta.status}.`,
      "error_http",
      respuesta.status,
    );
  }

  return cuerpo;
}

function conParametros(ruta, parametros = {}) {
  const limpios = Object.entries(parametros).filter(
    ([, valor]) => valor !== undefined && valor !== null && valor !== "",
  );
  if (limpios.length === 0) return ruta;
  return `${ruta}?${new URLSearchParams(limpios)}`;
}

export const api = {
  get: (ruta, parametros) => solicitar(conParametros(ruta, parametros)),
  post: (ruta, cuerpo) =>
    solicitar(ruta, { method: "POST", body: JSON.stringify(cuerpo ?? {}) }),
  put: (ruta, cuerpo) =>
    solicitar(ruta, { method: "PUT", body: JSON.stringify(cuerpo ?? {}) }),
  delete: (ruta) => solicitar(ruta, { method: "DELETE" }),
};

export { URL_BASE };
