FROM oven/bun:1.3.6-alpine AS base
WORKDIR /app

# Copy root package files
COPY package.json bun.lock tsconfig.json ./

# Copy shared packages
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies (production only)
RUN bun install --frozen-lockfile --production

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

# Set environment variables
ENV NODE_ENV=production
ENV BUN_INSTALL_GLOBALS=0

USER bun

CMD ["bun", "apps/worker/src/worker.ts"]
