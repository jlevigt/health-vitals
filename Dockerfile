# Use the official Bun image
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# Install dependencies Stage
FROM base AS install
# Copy root config files
COPY package.json bun.lock ./
# Copy all package.json files from packages
COPY packages/api/package.json ./packages/api/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

RUN bun install --frozen-lockfile

# Runner Stage
FROM base AS runner
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages ./packages
COPY . .

# Expone the API port
EXPOSE 3000

# Default command - can be overridden in docker-compose
CMD ["bun", "run", "dev:api"]
