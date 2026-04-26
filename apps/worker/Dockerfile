FROM oven/bun:1.3.12-alpine

WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy required packages
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/infra ./packages/infra

# Copy worker app
COPY apps/worker ./apps/worker

# Install dependencies
RUN bun install

CMD ["bun", "run", "--cwd", "apps/worker", "src/worker.ts"]
