# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source dan build
COPY . .

# Build argumen untuk API URL (diisi saat docker build)
ARG VITE_API_URL=https://api.hygiopark.io
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Nginx server ──────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build dari stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


