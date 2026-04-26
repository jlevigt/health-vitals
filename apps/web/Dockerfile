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
FROM nginx:stable-alpine

# Copy built files
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
