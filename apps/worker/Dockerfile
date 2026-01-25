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

FROM oven/bun:latest AS release
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/bun.lock ./bun.lock

ENV NODE_ENV=production

CMD ["bun", "run", "start:worker"]
