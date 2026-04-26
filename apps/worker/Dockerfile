# --- Stage 1: Base ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app

# --- Stage 2: Production Dependencies (Cached) ---
FROM base AS prod-deps
COPY package.json bun.lock tsconfig.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/infra/package.json ./packages/infra/
COPY apps/worker/package.json ./apps/worker/
RUN bun install --production

# --- Stage 3: Development Dependencies & Build ---
FROM prod-deps AS builder
RUN bun install 
COPY packages ./packages
COPY apps/worker ./apps/worker

# --- Stage 4: Runner ---
FROM base AS runner
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages ./packages
COPY --from=builder /app/apps/worker ./apps/worker
COPY --from=builder /app/package.json ./

USER bun
CMD ["bun", "run", "--cwd", "apps/worker", "src/worker.ts"]
