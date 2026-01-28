FROM oven/bun:1.3.6-alpine AS base
WORKDIR /app

# Copy root package files
COPY package.json bun.lock tsconfig.json ./

# Copy shared packages
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies (production only)
RUN bun install --production

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Set environment variables
ENV NODE_ENV=production
ENV BUN_INSTALL_GLOBALS=0

USER bun

CMD ["bun", "apps/api/src/server.ts"]
