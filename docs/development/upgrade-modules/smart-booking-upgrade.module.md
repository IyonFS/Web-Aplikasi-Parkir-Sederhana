# Smart Booking Upgrade Module

## Tujuan
Modul ini merangkum semua upgrade yang pernah diterapkan pada project Smart Parking agar bisa direplikasi ke folder/project baru hanya dengan satu prompt.

## Cakupan Upgrade
1. Fitur `Waitlist / Smart Queue`
2. Fitur `Recurring Booking`
3. Integrasi backend, database, API, scheduler, seed, dan frontend
4. Redesign UI halaman `Reservasi`
5. Redesign UI flow `Masuk Antrian` di halaman `Slot Parkir`
6. Redesign UI `Dashboard` agar lebih interaktif, bersih, dan profesional
7. Motion polish dan konsistensi visual lintas halaman

## Ringkasan Perubahan

### Backend
- Menambah model database untuk `WaitlistEntry` dan `RecurringBooking`
- Menambah controller, route, dan service untuk waitlist
- Menambah controller, route, dan service untuk recurring booking
- Menambah logika auto-promote waitlist saat slot tersedia
- Menambah logika confirm window untuk antrean
- Menambah scheduler recurring booking
- Menambah data seed/demo untuk waitlist dan recurring booking

### Frontend Feature
- Menambah `waitlist.service.js`
- Menambah `recurring.service.js`
- Menambah UI waitlist di halaman reservasi
- Menambah UI recurring booking di halaman reservasi
- Menambah modal custom untuk `Masuk Antrian`
- Menghubungkan halaman slot parkir dengan waitlist modal

### Frontend UI/UX
- Halaman `Reservasi` diubah menjadi `Smart Booking Hub`
- Layout reservasi dirapikan agar tidak menyisakan area kosong besar
- `Join Waitlist` tidak lagi memakai prompt/alert browser bawaan
- Halaman `Slot Parkir` diberi hero summary, helper cards, dan header/filter yang lebih rapi
- Halaman `Dashboard` dipoles untuk admin, operator, dan user
- Menambah animation utility untuk micro-interaction yang halus

## File Inti Yang Pernah Diubah

### Backend
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `backend/controllers/waitlist.controller.js`
- `backend/controllers/recurring.controller.js`
- `backend/routes/waitlist.routes.js`
- `backend/routes/recurring.routes.js`
- `backend/src/services/waitlist.service.js`
- `backend/src/services/recurring.service.js`

### Frontend
- `frontend/src/services/waitlist.service.js`
- `frontend/src/services/recurring.service.js`
- `frontend/src/pages/ReservationsPage.jsx`
- `frontend/src/pages/SlotsPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/components/WaitlistModal.jsx`
- `frontend/src/index.css`

## Ekspektasi Implementasi Di Project Baru

### Waitlist / Smart Queue
- User bisa masuk antrean dari slot yang sedang terisi
- Flow antrean memakai modal custom, bukan `prompt()` atau `alert()` default browser
- Sistem menyimpan posisi antrean, status, deadline konfirmasi, dan relasi user-slot
- User bisa melihat antrean aktif di halaman reservasi
- Jika antrean berstatus `notified`, user bisa konfirmasi dari halaman reservasi

### Recurring Booking
- User bisa membuat jadwal rutin harian atau mingguan
- Form recurring memakai dropdown slot, plat kendaraan, durasi, jam mulai, dan weekday picker jika mode mingguan
- Recurring schedule tampil sebagai daftar aktif di halaman reservasi
- Backend punya endpoint create/list/toggle/delete/run-now
- Scheduler recurring dapat membuat booking otomatis atau mendorong user ke waitlist jika slot penuh

### Reservations Page
- Layout harus terasa padat, konsisten, dan tidak meninggalkan ruang kosong yang tidak perlu
- Bagian atas memuat KPI cards
- Ada section `Waitlist & Smart Queue`
- Ada section `Recurring Booking`
- Ada rail/summary card agar komposisi layout seimbang
- Daftar reservasi tetap ada di bawah dengan CTA QR, extend, dan cancel

### Slots Page
- Header memuat live stats dan toggle `Grid/Denah`
- Ada hero/summary section di atas content
- Ada helper card untuk menjelaskan smart queue
- `Masuk Antrian` harus membuka modal custom yang konsisten dengan style reservasi
- Tidak boleh menggunakan `prompt()` untuk input antrean

### Dashboard
- Dashboard harus terlihat lebih profesional dan bersih
- Ada perbedaan presentasi untuk admin, operator, dan user
- User dashboard memiliki hero card, quick actions, floor insight, dan booking summary
- Admin/operator dashboard punya live feed, status lantai, dan quick action yang rapi

### Motion dan Polish
- Tambahkan animation utility seperti pulse, float, dan shine secara halus
- Hindari efek berlebihan; fokus pada clarity dan feel premium

## API / Data Contract Yang Perlu Ada
- `GET /api/waitlist`
- `POST /api/waitlist`
- `POST /api/waitlist/:id/confirm`
- `POST /api/waitlist/:id/cancel`
- `GET /api/recurring`
- `POST /api/recurring`
- `POST /api/recurring/:id/toggle`
- `DELETE /api/recurring/:id`
- `POST /api/recurring/run-now`

## Checklist Validasi
- Prisma schema terpasang dan client berhasil di-generate
- DB memiliki tabel waitlist dan recurring
- Frontend build sukses
- User bisa buka halaman Reservasi, Slot Parkir, dan Dashboard tanpa error
- Modal waitlist tampil normal
- Recurring form bisa submit
- UI terasa konsisten antar halaman

## Catatan Implementasi
- Pertahankan style visual project yang sudah ada, tetapi pastikan fitur baru menyatu dan tidak terlihat tempelan
- Jika struktur project baru berbeda, adaptasikan nama file dan route secara proporsional
- Jika backend project baru belum punya scheduler, buat mekanisme minimal yang setara untuk recurring booking dan confirm timeout

