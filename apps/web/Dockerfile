# --- Stage 1: Base ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app
ENV BUN_INSTALL_FROZEN_LOCKFILE=false

# --- Stage 2: Dependencies ---
FROM base AS deps
COPY package.json tsconfig.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/infra/package.json ./packages/infra/
COPY apps/web/package.json ./apps/web/
RUN bun install

# --- Stage 3: Builder ---
FROM deps AS builder
COPY . .
RUN bun run --cwd apps/web build

# --- Stage 4: Runner ---
FROM base AS runner
RUN bun install -g serve
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./

USER bun
EXPOSE 80
CMD ["bunx", "serve", "-s", "dist", "-l", "80"]
