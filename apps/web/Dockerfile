# --- Stage 1: Base ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app

# --- Stage 2: Build ---
FROM base AS builder
COPY package.json bun.lock tsconfig.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/infra/package.json ./packages/infra/
COPY apps/web/package.json ./apps/web/

# Install all deps (including dev for build)
RUN bun install

# Copy source and build
COPY packages ./packages
COPY apps/web ./apps/web
RUN bun run --cwd apps/web build

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app
# Install only the serving tool in runner
RUN bun install -g serve
# Copy only built assets
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./

USER bun
EXPOSE 80
CMD ["bunx", "serve", "-s", "dist", "-l", "80"]
