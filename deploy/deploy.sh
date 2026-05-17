#!/bin/bash
# deploy/deploy.sh
# Script deploy otomatis — jalankan dari server VPS
# Usage: bash deploy.sh

set -e  # Stop jika ada error

# ── Konfigurasi ────────────────────────────────────────────────────────────────
APP_DIR="/var/www/hygiopark"
REPO_URL="https://github.com/USERNAME/smart-parking.git"  # Ganti dengan repo kamu
BRANCH="main"
LOG_FILE="/var/log/hygiopark/deploy.log"

# ── Colors ─────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; exit 1; }

# ── Mulai Deploy ───────────────────────────────────────────────────────────────
log "🚀 Mulai deploy Hygiopark..."
mkdir -p /var/log/hygiopark

# 1. Pull kode terbaru
log "📥 Pull kode dari Git..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Setup backend
log "⚙ Setup backend..."
cd "$APP_DIR/backend"
npm ci --production
npx prisma generate
npx prisma migrate deploy
log "✓ Database migrated"

# 3. Build frontend
log "🔨 Build frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build
log "✓ Frontend built"

# 4. Copy frontend build ke Nginx
log "📂 Copy ke Nginx webroot..."
sudo rm -rf /var/www/html/hygiopark
sudo cp -r "$APP_DIR/frontend/dist" /var/www/html/hygiopark
sudo chown -R www-data:www-data /var/www/html/hygiopark

# 5. Reload Nginx
log "🔄 Reload Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 6. Restart backend dengan PM2
log "🔄 Restart backend PM2..."
cd "$APP_DIR/backend"
pm2 reload deploy/ecosystem.config.js --env production || \
pm2 start deploy/ecosystem.config.js --env production

# 7. Simpan PM2 config
pm2 save

log "✅ Deploy selesai!"
log "🌐 Aplikasi berjalan di: https://$(hostname -f)"
echo ""
pm2 status



