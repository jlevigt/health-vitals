FROM oven/bun:1.3.12-alpine

WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy required packages
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/infra ./packages/infra

# Copy migrator app
COPY apps/migrator ./apps/migrator

# Copy migrations folder (source of truth)
COPY database/migrations ./database/migrations

# Install dependencies
RUN bun install

# Set environment variable for migrations path inside container
ENV MIGRATIONS_DIR=/app/database/migrations

ENTRYPOINT ["bun", "run", "--cwd", "apps/migrator", "src/index.ts"]
