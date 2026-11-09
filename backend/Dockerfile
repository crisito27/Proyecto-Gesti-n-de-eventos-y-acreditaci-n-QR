# Imagen slim: trae Python sin las herramientas de compilación que no usamos.
FROM python:3.12-slim

# No escribir .pyc y no almacenar en buffer la salida, para ver los logs
# en tiempo real con `docker compose logs`.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

# Las dependencias se copian e instalan antes que el código: así Docker
# reutiliza esta capa mientras requirements.txt no cambie, y reconstruir
# tras editar el código toma segundos en lugar de minutos.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
