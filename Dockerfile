# Multi-stage build for Poster Director Agent

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY server/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server/ ./server/

# Copy frontend build from stage 1
COPY --from=frontend-builder /app/dist ./server/static/dist

# Create necessary directories
RUN mkdir -p server/outputs server/uploads

# Set working directory
WORKDIR /app/server

# Expose default port
EXPOSE 8766

# Health check (使用 $PORT 环境变量)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8766}/api/health || exit 1

# Run the application (使用 Render 分配的 $PORT)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8766}"
