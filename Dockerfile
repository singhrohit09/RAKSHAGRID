# RakshaGrid Multi-Stage Production Container
# Stage 1: Build Application
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build essentials for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy full application sources
COPY . .

# Build production assets (Vite frontend + typecheck)
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install runtime dependencies for SQLite / PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-privileged service user
RUN groupadd -r raksha && useradd -r -g raksha -d /app raksha

# Copy package descriptors & production node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig*.json ./

# Ensure storage directory exists and assign permissions to raksha user
RUN mkdir -p /app/server/data && chown -R raksha:raksha /app

USER raksha

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
