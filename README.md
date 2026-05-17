# Hygiopark

Sistem manajemen parkir pintar berbasis web untuk kebutuhan tugas ujian kompetensi sekolah.

Project ini sudah dirapikan agar mudah dipresentasikan:
- `frontend/` berisi aplikasi antarmuka pengguna
- `backend/` berisi API, database, dan logika bisnis
- `docs/presentation/` berisi materi bantu presentasi
- `docs/development/` berisi catatan teknis pengembangan
- `deploy/` berisi file deployment produksi

## Mulai Dari Sini

1. Buka [docs/presentation/START-HERE.md](./docs/presentation/START-HERE.md)
2. Lihat [docs/presentation/STRUKTUR-FOLDER.md](./docs/presentation/STRUKTUR-FOLDER.md)
3. Gunakan [docs/presentation/CHECKLIST-DEMO.md](./docs/presentation/CHECKLIST-DEMO.md)

## Struktur Inti

```text
smart-parking/
|- backend/
|  |- src/
|  |  |- app.js
|  |  |- config/
|  |  |- middlewares/
|  |  |- modules/
|  |  |- repositories/
|  |  |- routes/
|  |  |- services/
|  |  `- socket/
|  |- prisma/
|  `- server.js
|- frontend/             # Lapisan tampilan (pengganti views/public pada pola monolith)
|- docs/
|  |- presentation/
|  `- development/
|- deploy/
|- docker-compose.yml
|- docker-compose.prod.yml
`- DEPLOY.md
```

## Cara Menjalankan Lokal

### 1. Jalankan database

Paling mudah gunakan Docker:

```bash
docker compose up -d postgres
```

### 2. Jalankan backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

Backend aktif di `http://localhost:4000`.

### 3. Jalankan frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Frontend aktif di `http://localhost:5173`.

## Akun Demo

Semua password demo: `password123`

| Peran | Email |
|---|---|
| Admin | `admin@hygiopark.io` |
| Operator | `operator@hygiopark.io` |
| User | `user@hygiopark.io` |
| User 2 | `siti@hygiopark.io` |

## Catatan Folder

- `frontend/dist/` adalah hasil build dan bisa dibuat ulang.
- `node_modules/` ada untuk kebutuhan lokal, bukan bagian materi presentasi.
- `docs/development/upgrade-modules/` menyimpan catatan peningkatan fitur, bukan dokumen utama presentasi.
- `backend/src/modules/` sekarang menjadi pusat pengelompokan fitur backend agar lebih mudah dijelaskan saat ujian.
- `frontend/` tetap dipisah karena project ini memakai React, bukan EJS monolith.

## Arah Presentasi

- Jelaskan masalah parkir yang ingin diselesaikan.
- Tunjukkan peran pengguna: admin, operator, dan user.
- Demo alur reservasi slot.
- Tunjukkan monitoring status slot secara real-time.
- Tutup dengan penjelasan struktur sistem frontend, backend, dan database.


