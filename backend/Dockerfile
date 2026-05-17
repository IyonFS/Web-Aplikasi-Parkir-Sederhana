# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dulu (cache layer)
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install semua deps termasuk devDeps (butuh prisma CLI)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy semua source code
COPY . .

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init untuk proper signal handling
RUN apk add --no-cache dumb-init

# Copy dari builder hanya yang diperlukan
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Copy source code
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
COPY src ./src
COPY server.js ./

# Buat user non-root untuk keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S Hygiopark -u 1001
USER Hygiopark

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Pakai dumb-init sebagai PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]


