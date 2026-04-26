# --- Stage 1: Base (Dependencies) ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy required packages
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/infra ./packages/infra

# Copy migrator app
COPY apps/migrator ./apps/migrator

# Copy migrations folder
COPY database/migrations ./database/migrations

# Install all dependencies
RUN bun install 

# --- Stage 2: Pruning ---
FROM base AS build
# Prune dev dependencies
RUN rm -rf node_modules && bun install --production 

# --- Stage 3: Runner ---
FROM oven/bun:1.3.12-alpine AS runner
WORKDIR /app

# Copy only what's needed for runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/migrator ./apps/migrator
COPY --from=build /app/database/migrations ./database/migrations
COPY --from=build /app/package.json ./

# Set migrations path for the app
ENV MIGRATIONS_DIR=/app/database/migrations

# Security: Run as non-root user
USER bun

ENTRYPOINT ["bun", "run", "--cwd", "apps/migrator", "src/index.ts"]
