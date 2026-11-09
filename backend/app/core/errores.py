"""Errores de dominio.

Los servicios no conocen HTTP: lanzan estas excepciones. Un manejador
registrado en main.py las traduce a la respuesta HTTP correspondiente. Así la
lógica de negocio queda independiente del framework y los errores salen todos
con la misma forma.
"""


class ErrorDominio(Exception):
    """Base de todos los errores previsibles del negocio."""

    estado_http = 400
    codigo = "error_dominio"

    def __init__(self, mensaje: str, codigo: str | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        if codigo:
            self.codigo = codigo


class NoEncontrado(ErrorDominio):
    estado_http = 404
    codigo = "no_encontrado"


class Conflicto(ErrorDominio):
    """La petición es válida pero choca con el estado actual del sistema.

    Ejemplos: inscribirse dos veces, aforo lleno, acreditar una entrada ya
    utilizada. Se responde 409.
    """

    estado_http = 409
    codigo = "conflicto"


class ReglaNegocio(ErrorDominio):
    """Operación no permitida por una regla del dominio. Se responde 422."""

    estado_http = 422
    codigo = "regla_negocio"


class ServicioExterno(ErrorDominio):
    """Una dependencia externa falló o no respondió. Se responde 503."""

    estado_http = 503
    codigo = "servicio_externo"
