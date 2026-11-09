"""Configuración de la aplicación.

Todos los valores se leen desde variables de entorno. Ningún secreto queda
escrito en el código: el archivo .env real no se versiona y en el repositorio
sólo vive .env.example con valores de ejemplo.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Aplicación ---
    app_nombre: str = "AcreditaQR API"
    app_version: str = "1.0.0"
    debug: bool = False

    # --- PostgreSQL ---
    postgres_user: str = "acreditaqr"
    postgres_password: str = "cambiame"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "acreditaqr"

    # --- MongoDB ---
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "acreditaqr_registros"

    # --- CORS: orígenes del frontend React, separados por coma ---
    cors_origenes: str = "http://localhost:5173,http://localhost:4173"

    # --- API pública de clima (Open-Meteo, sin clave) ---
    open_meteo_url: str = "https://api.open-meteo.com/v1/forecast"
    open_meteo_timeout: float = 8.0

    @property
    def database_url(self) -> str:
        """URL de conexión a PostgreSQL que usa SQLAlchemy."""
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def lista_cors(self) -> list[str]:
        return [origen.strip() for origen in self.cors_origenes.split(",") if origen.strip()]


settings = Settings()
