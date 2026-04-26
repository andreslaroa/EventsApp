# ── Stage 1: Build the frontend ──────────────────────────────
FROM node:20-alpine AS frontend-builder

# Definimos la carpeta de trabajo virtual
WORKDIR /app/frontend

# Copiamos solo los archivos de dependencias e instalamos
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# ¡AQUÍ ESTABA EL DETALLE! Copiamos el código y construimos
COPY frontend/ .
RUN npm run build
# CRACO outputs to /app/frontend/build

# ── Stage 2: Python backend ───────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Extraemos la carpeta 'build' desde la ruta exacta donde se generó en la etapa 1
COPY --from=frontend-builder /app/frontend/build ./static

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
