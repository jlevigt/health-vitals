FROM oven/bun:latest AS base
WORKDIR /app

# Install dependencies based on lockfile
COPY package.json bun.lock tsconfig.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
COPY packages/worker/package.json ./packages/worker/

# Clean install
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build step if needed (or just run directly with bun)
# For this monorepo setup, we can run directly.

FROM oven/bun:latest AS release
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/bun.lock ./bun.lock

# Script for starting might be needed to wait for resources or run migrations
# We'll rely on the entrypoint script which we will mount or COPY

ENV NODE_ENV=production
EXPOSE 3000

RUN chmod +x infra/scripts/entrypoint.sh
ENTRYPOINT ["infra/scripts/entrypoint.sh"]
CMD ["bun", "run", "start:api"]
