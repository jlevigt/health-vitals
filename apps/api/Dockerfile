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
# Prune dev dependencies in place (more reliable for workspaces)
RUN bun install --production

USER bun
EXPOSE 3000
CMD ["bun", "run", "--cwd", "apps/api", "src/server.ts"]
