FROM oven/bun:1.3.6

WORKDIR /app

# Copy only worker workspace
COPY apps/worker ./apps/worker
COPY packages/shared ./packages/shared
COPY package.json bun.lock tsconfig.json ./

# Install ONLY worker deps
RUN bun install --cwd apps/worker

CMD ["bun", "run", "--cwd", "apps/worker", "src/worker.ts"]
