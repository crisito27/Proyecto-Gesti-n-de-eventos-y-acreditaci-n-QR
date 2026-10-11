/* =========================================================
   climaApi.js — integración con la API pública Open-Meteo
   Documentación oficial: https://open-meteo.com/en/docs

   Endpoint:  GET https://api.open-meteo.com/v1/forecast
   Parámetros: latitude, longitude, daily, timezone,
               start_date, end_date
   No requiere clave de API ni autenticación.

   Aporte funcional: los eventos al aire libre dependen del
   clima. Mostrar el pronóstico de la fecha y lugar del evento
   ayuda a la persona a decidir si se inscribe y cómo asistir.
   ========================================================= */

const URL_BASE = "https://api.open-meteo.com/v1/forecast";

// Códigos WMO que devuelve Open-Meteo en "weather_code",
// traducidos a una descripción legible en español.
const DESCRIPCIONES_WMO = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina con escarcha",
  51: "Llovizna débil",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  61: "Lluvia débil",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  71: "Nieve débil",
  73: "Nieve moderada",
  75: "Nieve intensa",
  80: "Chubascos aislados",
  81: "Chubascos moderados",
  82: "Chubascos fuertes",
  95: "Tormenta eléctrica",
};

export function describirClima(codigo) {
  return DESCRIPCIONES_WMO[codigo] ?? "Sin descripción disponible";
}

/**
 * Consulta el pronóstico diario para una coordenada y una fecha.
 * Devuelve un objeto {fecha, tempMax, tempMin, codigo} o null si
 * la API no tiene datos para esa fecha (el pronóstico de Open-Meteo
 * cubre aproximadamente los próximos 16 días).
 */
export async function obtenerClima(lat, lon, fecha, signal) {
  const parametros = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    timezone: "auto",
    start_date: fecha,
    end_date: fecha,
  });

  const respuesta = await fetch(`${URL_BASE}?${parametros}`, { signal });

  // fetch sólo rechaza por errores de red: un 404 o 400 llega como
  // respuesta "exitosa", por eso revisamos ok explícitamente.
  if (!respuesta.ok) {
    throw new Error(`La API de clima respondió con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  const diario = datos.daily;

  if (!diario || !Array.isArray(diario.time) || diario.time.length === 0) {
    return null;
  }

  const valores = [
    diario.temperature_2m_max?.[0],
    diario.temperature_2m_min?.[0],
    diario.weather_code?.[0],
  ];
  if (!valores.every(Number.isFinite)) {
    return null;
  }

  return {
    fecha: diario.time[0],
    tempMax: diario.temperature_2m_max[0],
    tempMin: diario.temperature_2m_min[0],
    codigo: diario.weather_code[0],
  };
}
