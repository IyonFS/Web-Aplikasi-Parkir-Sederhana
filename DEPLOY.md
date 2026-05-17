# 🚀 Panduan Deploy Hygiopark ke VPS

## Prasyarat

| Kebutuhan | Spesifikasi minimum |
|---|---|
| VPS | 1 vCPU, 1GB RAM, 20GB SSD |
| OS | Ubuntu 22.04 LTS |
| Domain | Sudah diarahkan ke IP VPS (A record) |
| Provider rekomendasi | DigitalOcean, Vultr, Contabo, IDCloudHost |

---

## Pilih Metode Deploy

| Metode | Cocok untuk | Kompleksitas |
|---|---|---|
| **A — Docker Compose** | Production siap pakai | ⭐⭐⭐ |
| **B — Manual + PM2** | Belajar & kontrol penuh | ⭐⭐ |

---

# Metode A — Docker Compose (Direkomendasikan)

## A1. Setup VPS Baru

```bash
# Login ke VPS via SSH
ssh root@IP_VPS_KAMU

# Update sistem
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install docker-compose-plugin -y

# Buat user non-root
adduser hygiopark
usermod -aG docker hygiopark
su - hygiopark
```

## A2. Upload Project

```bash
# Di PC lokal — upload ke VPS
scp -r smart-parking/ hygiopark@IP_VPS:/home/hygiopark/

# Atau clone dari Git (lebih direkomendasikan)
git clone https://github.com/USERNAME/smart-parking.git
cd smart-parking
```

## A3. Setup Environment

```bash
cd /home/hygiopark/smart-parking

# Buat file .env dari template
cp deploy/.env.production .env

# Edit dan isi semua nilai
nano .env
```

Isi `.env` dengan nilai nyata:
```env
DB_USER=hygiopark
DB_PASSWORD=P@ssw0rd_Kuat_2024!
DB_NAME=hygiopark
DATABASE_URL=postgresql://hygiopark:P@ssw0rd_Kuat_2024!@postgres:5432/hygiopark
JWT_SECRET=abc123...64karakter_random...xyz
FRONTEND_URL=https://hygiopark.io
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## A4. Edit Domain di Nginx Config

```bash
nano deploy/nginx/conf.d/hygiopark.conf
```

Ganti semua `hygiopark.io` dengan domain kamu.

## A5. Jalankan Aplikasi

```bash
# Build dan jalankan semua service
docker compose -f docker-compose.prod.yml up -d --build

# Cek status
docker compose -f docker-compose.prod.yml ps

# Lihat logs
docker compose -f docker-compose.prod.yml logs -f backend
```

## A6. Setup SSL (HTTPS)

```bash
# Pastikan port 80 sudah bisa diakses dari internet
# Jalankan certbot
docker compose -f docker-compose.prod.yml --profile ssl run certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email kamu@email.com \
  --agree-tos \
  --no-eff-email \
  -d hygiopark.io \
  -d www.hygiopark.io

# Reload nginx untuk aktifkan SSL
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## A7. Auto-renew SSL

```bash
# Tambah ke crontab
crontab -e

# Tambah baris ini:
0 3 * * * docker compose -f /home/hygiopark/smart-parking/docker-compose.prod.yml \
  --profile ssl run certbot renew --quiet && \
  docker compose -f /home/hygiopark/smart-parking/docker-compose.prod.yml \
  exec nginx nginx -s reload
```

## A8. Perintah Berguna

```bash
# Lihat semua service
docker compose -f docker-compose.prod.yml ps

# Restart backend saja
docker compose -f docker-compose.prod.yml restart backend

# Lihat log real-time
docker compose -f docker-compose.prod.yml logs -f

# Update ke versi terbaru
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
docker exec hygiopark-db pg_dump -U Hygiopark Hygiopark > backup_$(date +%Y%m%d).sql

# Stop semua
docker compose -f docker-compose.prod.yml down
```

---

# Metode B — Manual + PM2 (Tanpa Docker)

## B1. Setup VPS

```bash
ssh root@IP_VPS

# Update sistem
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 secara global
npm install -g pm2

# Install Certbot untuk SSL
apt install -y certbot python3-certbot-nginx
```

## B2. Setup PostgreSQL

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Di dalam psql:
CREATE USER hygiopark WITH PASSWORD 'PASSWORD_KUAT_KAMU';
CREATE DATABASE hygiopark OWNER hygiopark;
GRANT ALL PRIVILEGES ON DATABASE hygiopark TO hygiopark;
\q
```

## B3. Upload & Setup Project

```bash
# Buat direktori
mkdir -p /var/www/hygiopark
mkdir -p /var/log/hygiopark

# Upload atau clone project
cd /var/www/hygiopark
git clone https://github.com/USERNAME/smart-parking.git .

# Setup backend
cd /var/www/hygiopark/backend
npm ci --production
npx prisma generate

# Buat file .env
cp deploy/.env.production .env
nano .env  # isi dengan nilai nyata

# Jalankan migrasi
npx prisma migrate deploy

# Isi data awal (opsional)
node prisma/seed.js
```

## B4. Build Frontend

```bash
cd /var/www/hygiopark/frontend

# Buat .env untuk frontend
echo 'VITE_API_URL=https://hygiopark.io' > .env.production

npm ci
npm run build

# Copy ke Nginx webroot
cp -r dist /var/www/html/hygiopark
```

## B5. Setup Nginx

```bash
# Buat config
nano /etc/nginx/sites-available/hygiopark
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name hygiopark.io www.hygiopark.io;

    # Frontend (React SPA)
    root /var/www/html/hygiopark;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

```bash
# Aktifkan config
ln -s /etc/nginx/sites-available/hygiopark /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## B6. Setup SSL

```bash
certbot --nginx -d hygiopark.io -d www.hygiopark.io
```

Certbot otomatis edit nginx config dan setup auto-renew.

## B7. Jalankan Backend dengan PM2

```bash
cd /var/www/hygiopark/backend
pm2 start deploy/ecosystem.config.js --env production
pm2 save

# Jalankan PM2 otomatis saat server restart
pm2 startup
# Ikuti perintah yang muncul
```

## B8. Cek Status

```bash
pm2 status
pm2 logs hygiopark-api
curl https://hygiopark.io/api/health
```

---

## Checklist Setelah Deploy

- [ ] `https://hygiopark.io` terbuka di browser
- [ ] `https://hygiopark.io/api/health` return `{"status":"ok","db":"connected"}`
- [ ] Login dengan akun demo berhasil
- [ ] Booking slot berhasil
- [ ] WebSocket real-time bekerja (buka 2 tab)
- [ ] SSL aktif (gembok hijau di browser)
- [ ] Auto-renew SSL terkonfigurasi

---

## Troubleshooting

### Backend tidak bisa konek database
```bash
# Cek apakah PostgreSQL jalan
systemctl status postgresql
# atau (Docker)
docker compose -f docker-compose.prod.yml logs postgres

# Test koneksi manual
psql -U Hygiopark -h localhost -d Hygiopark
```

### Nginx 502 Bad Gateway
```bash
# Pastikan backend jalan
pm2 status  # atau: docker compose ps
curl http://localhost:4000/api/health

# Cek log nginx
tail -f /var/log/nginx/error.log
```

### WebSocket tidak terhubung
```bash
# Pastikan nginx config punya location /socket.io/
# Pastikan FRONTEND_URL di .env sama dengan domain yang diakses
```

### SSL gagal
```bash
# Pastikan domain sudah pointing ke IP VPS
dig +short hygiopark.io

# Port 80 harus terbuka
ufw allow 80
ufw allow 443
```

---

## Monitoring Produksi

```bash
# CPU & Memory
htop

# PM2 monitor
pm2 monit

# Log real-time
pm2 logs --lines 100

# Disk usage
df -h

# Backup database otomatis (tambah ke crontab)
0 2 * * * pg_dump -U Hygiopark Hygiopark | gzip > /backup/Hygiopark_$(date +\%Y\%m\%d).sql.gz
```



