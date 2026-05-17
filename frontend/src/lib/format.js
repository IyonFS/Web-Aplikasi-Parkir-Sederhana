// lib/format.js — Semua fungsi formatting terpusat di sini

// Format Rupiah: 101000 → "Rp 101.000"
export function formatIDR(amount) {
  if (amount == null || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format IDR singkat: 1500000 → "Rp 1,5Jt" | 50000 → "Rp 50K"
export function formatIDRShort(amount) {
  if (amount == null || isNaN(amount)) return "Rp 0";
  if (amount >= 1_000_000)
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".0", "")}Jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}K`;
  return formatIDR(amount);
}

// Format tarif per jam: 5000 → "Rp 5.000/jam"
export function formatRate(pricePerHour) {
  return `${formatIDR(pricePerHour)}/jam`;
}

// Format tanggal panjang: ISO → "18 Mar 2026"
export function formatDateLong(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Hitung total: (2, 5000) → 10000
export function calcTotal(hours, pricePerHour) {
  return Number(hours) * Number(pricePerHour);
}

// Format tanggal lengkap: ISO → "18 Mar 2026, 10.30"
export function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format tanggal pendek: ISO → "18 Mar, 10.30"
export function formatDateShort(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Validasi format plat nomor Indonesia: "B 1234 XYZ"
export function validatePlate(plate) {
  const clean = plate.trim().toUpperCase().replace(/\s+/g, " ");
  if (!clean) return "Plat nomor wajib diisi";
  if (clean.length < 4) return "Plat nomor terlalu pendek";
  if (clean.length > 12) return "Plat nomor terlalu panjang";
  return null; // null = valid
}

// Validasi email
export function validateEmail(email) {
  if (!email) return "Email wajib diisi";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Format email tidak valid";
  return null;
}

// Validasi password
export function validatePassword(password) {
  if (!password) return "Password wajib diisi";
  if (password.length < 6) return "Password minimal 6 karakter";
  return null;
}

