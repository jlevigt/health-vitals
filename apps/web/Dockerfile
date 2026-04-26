# --- Stage 1: Build ---
FROM oven/bun:1.3.12-alpine AS build
WORKDIR /app

# Copy root config and lockfile
COPY package.json bun.lock tsconfig.json ./

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN bun install

# Build the app
RUN bun run --cwd apps/web build

# --- Stage 2: Runner ---
FROM oven/bun:1.3.12-alpine AS runner
WORKDIR /app

# Copy built files
COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/apps/web/package.json ./

# Install serve to serve static files
RUN bun install -g serve

# Security: Run as non-root user
USER bun

EXPOSE 80

# Serve the application
CMD ["bunx", "serve", "-s", "dist", "-l", "80"]
