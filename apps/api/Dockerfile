# --- Stage 1: Base ---
FROM oven/bun:1.3.12-alpine AS base
WORKDIR /app

# --- Stage 2: Production Dependencies (Cached) ---
FROM base AS prod-deps
COPY package.json bun.lock tsconfig.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/infra/package.json ./packages/infra/
COPY apps/api/package.json ./apps/api/
RUN bun install --production

# --- Stage 3: Development Dependencies & Build ---
FROM prod-deps AS builder
# Install dev dependencies
RUN bun install 
# Copy source code
COPY packages ./packages
COPY apps/api ./apps/api
# Build/Typecheck (since Bun doesn't strictly need a build step for API, we just verify)
# If you added a build script to apps/api, uncomment the next line:
# RUN bun run --filter @health-vitals/api build

# --- Stage 4: Runner ---
FROM base AS runner
WORKDIR /app
# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages ./packages
# Copy application source
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/package.json ./

# Security: Run as non-root user
USER bun
EXPOSE 3000

CMD ["bun", "run", "--cwd", "apps/api", "src/server.ts"]
