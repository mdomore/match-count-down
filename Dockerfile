# Stage 1: Build Next.js frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build NestJS backend
FROM node:18-alpine as backend-builder

WORKDIR /app/backend

# Copy package files first for better caching
COPY backend/package*.json ./
RUN npm install

# Copy backend source and build
COPY backend/ ./
RUN npm run build

# Stage 3: Final image with supervisor and node
FROM node:18-alpine

# Install supervisor in one layer
RUN apk add --no-cache supervisor && \
    mkdir -p /var/log/backend /var/log/frontend

WORKDIR /app

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copy built Next.js frontend (standalone output)
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 3001

CMD ["/start.sh"]

