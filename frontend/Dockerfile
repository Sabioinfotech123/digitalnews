# Build stage — Node 20+. VITE_API_URL is forced so a local frontend/.env
# cannot bake localhost:8000 into the QA bundle.
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Compose may pass this ARG; ENV is hardcoded so a host .env cannot win.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=/api/v1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Belt-and-suspenders: Docker ENV wins over Vite .env files, and any
# leftover env files are removed even if .dockerignore was bypassed.
RUN rm -f .env .env.local .env.production .env.production.local .env.development .env.development.local \
    && npm run build

# Runtime — static SPA + /api/ reverse proxy. API is not published on the host.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
