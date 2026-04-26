# --- Stage 1: Base (Dependencies) ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy required packages
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/infra ./packages/infra

# Copy api app
COPY apps/api ./apps/api

# Install all dependencies (needed for build/tsc)
RUN bun install 

# --- Stage 2: Pruning ---
FROM base AS build
# Prune dev dependencies for production
RUN rm -rf node_modules && bun install --production 

# --- Stage 3: Runner ---
FROM oven/bun:1.3.12-alpine AS runner
WORKDIR /app

# Copy only what's needed for runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/package.json ./

# Security: Run as non-root user
USER bun

EXPOSE 3000

# Use bun to run the TS file directly (efficient in Bun)
CMD ["bun", "run", "--cwd", "apps/api", "src/server.ts"]
