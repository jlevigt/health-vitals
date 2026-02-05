FROM oven/bun:1.3.6

WORKDIR /app

# Copy only API workspace
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY package.json bun.lock tsconfig.json ./

# Install ONLY api deps
RUN bun install --cwd apps/api

CMD ["bun", "run", "--cwd", "apps/api", "src/server.ts"]
