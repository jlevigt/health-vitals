FROM oven/bun:1.3.12-alpine

WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy required packages
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/infra ./packages/infra

# Copy api app
COPY apps/api ./apps/api

# Install dependencies
RUN bun install

EXPOSE 3000

CMD ["bun", "run", "--cwd", "apps/api", "src/server.ts"]
