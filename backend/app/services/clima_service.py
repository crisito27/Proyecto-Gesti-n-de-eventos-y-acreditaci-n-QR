"""API pública: Open-Meteo.

Qué cambió respecto del Taller 2
--------------------------------
En el Taller 2 esta llamada se hacía desde React, directamente en el
navegador. En el Hito 3 se movió al backend, por tres razones:

  1. El backend ya conoce las coordenadas y la fecha del evento. El frontend
     pide el clima de un evento por su id y no necesita saber nada de la API
     externa ni armar la URL.
  2. La traducción de los códigos WMO y el manejo de fallos quedan en un solo
     lugar, y el cliente móvil del Hito 4 los reutiliza sin reescribirlos.
  3. Si en el futuro la API requiriera una clave, viviría en el servidor como
     variable de entorno y nunca llegaría al navegador.

Se mantiene Open-Meteo porque sigue siendo pertinente: varios eventos del
dominio son al aire libre y el pronóstico influye en la decisión de asistir.
No requiere clave de API.
"""

import httpx

from app.core.config import settings
from app.core.errores import ServicioExterno
from app.schemas.comunes import ClimaSalida

# Códigos WMO que devuelve Open-Meteo en `weather_code`.
DESCRIPCIONES_WMO: dict[int, str] = {
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
}


def describir(codigo: int) -> str:
    return DESCRIPCIONES_WMO.get(codigo, "Sin descripción disponible")


def obtener_pronostico(latitud: float, longitud: float, fecha: str) -> ClimaSalida | None:
    """Consulta el pronóstico diario.

    Devuelve None cuando la API responde correctamente pero no tiene datos
    para esa fecha: el pronóstico de Open-Meteo cubre unos 16 días, así que un
    evento lejano simplemente no tiene información todavía. Eso no es un
    error y el frontend lo muestra como tal.
    """
    parametros = {
        "latitude": latitud,
        "longitude": longitud,
        "daily": "temperature_2m_max,temperature_2m_min,weather_code",
        "timezone": "auto",
        "start_date": fecha,
        "end_date": fecha,
    }

    try:
        respuesta = httpx.get(
            settings.open_meteo_url,
            params=parametros,
            timeout=settings.open_meteo_timeout,
        )
        respuesta.raise_for_status()
        datos = respuesta.json()
    except httpx.TimeoutException as exc:
        raise ServicioExterno(
            "El servicio de pronóstico no respondió a tiempo.", codigo="clima_timeout"
        ) from exc
    except httpx.HTTPError as exc:
        raise ServicioExterno(
            "No se pudo consultar el servicio de pronóstico.", codigo="clima_no_disponible"
        ) from exc
    except ValueError as exc:
        raise ServicioExterno(
            "El servicio de pronóstico devolvió una respuesta ilegible.",
            codigo="clima_respuesta_invalida",
        ) from exc

    diario = datos.get("daily") or {}
    tiempos = diario.get("time") or []
    if not tiempos:
        return None

    try:
        return ClimaSalida(
            fecha=tiempos[0],
            temp_min=diario["temperature_2m_min"][0],
            temp_max=diario["temperature_2m_max"][0],
            codigo_wmo=diario["weather_code"][0],
            descripcion=describir(diario["weather_code"][0]),
        )
    except (KeyError, IndexError, TypeError):
        # La API respondió 200 pero con la estructura incompleta.
        return None
