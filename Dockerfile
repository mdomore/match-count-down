# Stage 1: Build Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Prepare FastAPI backend dependencies
FROM python:3.11-slim AS backend-builder

ENV PIP_NO_CACHE_DIR=1
WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip wheel --wheel-dir /wheels -r requirements.txt
COPY backend/ .

# Stage 3: Final image with Node.js, Python, and supervisor
FROM node:18-slim

ENV PIP_NO_CACHE_DIR=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-venv python3-pip supervisor && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /var/log/backend /var/log/frontend

WORKDIR /app

# Copy FastAPI backend code and dependencies
COPY --from=backend-builder /app/backend /backend
COPY --from=backend-builder /wheels /wheels
RUN python3 -m venv /backend/.venv && \
    /backend/.venv/bin/pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels

# Copy built Next.js frontend (standalone output)
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 3001

CMD ["/start.sh"]

