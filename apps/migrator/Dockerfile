# --- Stage 1: Base ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app
ENV BUN_INSTALL_FROZEN_LOCKFILE=false

# --- Stage 2: Build ---
FROM base AS builder
COPY . .
RUN bun install

# --- Stage 3: Runner ---
FROM base AS runner
COPY --from=builder /app ./
RUN bun install --production

ENV MIGRATIONS_DIR=/app/database/migrations

USER bun
ENTRYPOINT ["bun", "run", "--cwd", "apps/migrator", "src/index.ts"]
