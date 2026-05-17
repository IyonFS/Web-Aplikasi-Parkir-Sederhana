import { useCallback, useEffect, useMemo, useState } from "react";
import { reservationsService } from "../services/reservations.service";
import { paymentService } from "../services/payment.service";
import { useAuth } from "../context/AuthContext";
import { useSocketEvents } from "../hooks/useSocket";
import { formatDateShort, formatIDR } from "../lib/format";
import { openPrintWindow } from "../lib/print";
import {
  EmptyState,
  KPICard,
  PageHeader,
  SectionCard,
  StatusDot,
  Toast,
} from "../components/ui";
import QRTicketModal from "../components/QRTicketModal";
import ExtendModal from "../components/ExtendModal";
import PendingPaymentModal from "../components/PendingPaymentModal";
import ConfirmDialog from "../components/ConfirmDialog";

const TABS = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
  { key: "pending_payment", label: "Menunggu Bayar" },
];

const REMOVABLE_TRANSACTION_STATUSES = ["completed", "cancelled", "expired"];

function getPaymentTone(status) {
  if (status === "paid") {
    return { label: "Lunas", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" };
  }
  if (status === "pending") {
    return { label: "Menunggu", color: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 10%, transparent)" };
  }
  return { label: "Belum ada", color: "var(--text-dim)", bg: "var(--surface)" };
}

function formatPaymentMethod(payment) {
  if (!payment) return "Belum ada pembayaran";
  if (payment.vaBank) return `${payment.vaBank.toUpperCase()} VA`;
  if (payment.midtransPaymentType === "credit_card") return "Kartu";
  if (payment.midtransPaymentType === "qris") return "QRIS";
  if (payment.midtransPaymentType === "gopay") return "GoPay";
  if (payment.midtransPaymentType === "shopeepay") return "ShopeePay";
  if (payment.method?.startsWith("demo_")) return "Sandbox";
  return payment.midtransPaymentType || payment.method || "Pembayaran";
}

function PaymentDetailModal({ invoice, loading, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handlePrint = () => {
    if (!invoice) return;
    openPrintWindow({
      title: invoice.invoiceNumber,
      body: `
        <section class="receipt-shell">
          <article class="receipt-card">
            <header class="receipt-header">
              <div>
                <div class="receipt-brand">Hygiopark</div>
                <h1>Struk Pembayaran Parkir</h1>
                <p>${invoice.invoiceNumber}</p>
              </div>
              <div class="receipt-status">${invoice.status === "paid" ? "LUNAS" : "MENUNGGU"}</div>
            </header>
            <div class="receipt-grid">
              <div><span>Area</span><strong>${invoice.location?.lotName || "-"}</strong></div>
              <div><span>Slot</span><strong>${invoice.booking?.slotNumber || "-"}</strong></div>
              <div><span>Kendaraan</span><strong>${invoice.booking?.vehiclePlate || "-"}</strong></div>
              <div><span>Jenis</span><strong>${invoice.booking?.vehicleType || "-"}</strong></div>
              <div><span>Mulai</span><strong>${invoice.booking?.startTime ? formatDateShort(invoice.booking.startTime) : "-"}</strong></div>
              <div><span>Selesai</span><strong>${invoice.booking?.endTime ? formatDateShort(invoice.booking.endTime) : "-"}</strong></div>
              <div><span>Metode</span><strong>${invoice.paymentType || invoice.paymentMethod || "-"}</strong></div>
              <div><span>Dibayar</span><strong>${invoice.issuedAt ? formatDateShort(invoice.issuedAt) : "-"}</strong></div>
            </div>
            <div class="receipt-total">
              <span>Total Pembayaran</span>
              <strong>${formatIDR(invoice.total || 0)}</strong>
            </div>
            <footer class="receipt-note">Struk ini diterbitkan otomatis oleh sistem Hygiopark.</footer>
          </article>
        </section>
      `,
      styles: `
        .receipt-shell { display:flex; justify-content:center; }
        .receipt-card {
          width: 760px;
          background:#fff;
          border:1px solid #d0d5dd;
          border-radius:28px;
          padding:28px;
          box-shadow:0 12px 40px rgba(16,24,40,.08);
        }
        .receipt-header {
          display:flex;
          justify-content:space-between;
          gap:16px;
          padding-bottom:18px;
          border-bottom:1px solid #eaecf0;
        }
        .receipt-brand {
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:.2em;
          color:#0ea37f;
          font-weight:700;
        }
        .receipt-header h1 { margin:8px 0 6px; font-size:28px; }
        .receipt-header p { margin:0; font-size:13px; color:#667085; }
        .receipt-status {
          align-self:flex-start;
          padding:10px 14px;
          border-radius:999px;
          border:1px solid #b7e4d7;
          color:#0ea37f;
          background:#ecfdf3;
          font-size:12px;
          font-weight:700;
        }
        .receipt-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px 24px;
          padding:22px 0;
        }
        .receipt-grid span {
          display:block;
          margin-bottom:6px;
          font-size:11px;
          letter-spacing:.14em;
          text-transform:uppercase;
          color:#667085;
        }
        .receipt-grid strong { color:#101828; font-size:14px; }
        .receipt-total {
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding-top:18px;
          border-top:1px dashed #d0d5dd;
          font-size:15px;
        }
        .receipt-total strong { font-size:24px; color:#0ea37f; }
        .receipt-note {
          margin-top:16px;
          text-align:center;
          color:#667085;
          font-size:12px;
        }
        @media print {
          .receipt-card { box-shadow:none; border-color:#111827; }
        }
      `,
    });
  };

  if (!invoice && !loading) return null;

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-[120] overflow-y-auto"
      style={{ background: "rgba(6,10,20,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div className="min-h-screen flex items-center justify-center p-4" onClick={onClose}>
        <div
          role="dialog"
          onClick={(event) => event.stopPropagation()}
          className="relative z-[121] w-full md:max-w-2xl rounded-[28px] overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          }}
        >
          <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "#f59e0b" }}>
                Detail Struk
              </p>
              <h3 className="text-xl font-semibold mt-1" style={{ color: "var(--text)" }}>
                {loading ? "Memuat struk..." : invoice?.invoiceNumber}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost px-3 py-2">
              Tutup
            </button>
          </div>

          <div className="p-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-[24px] p-5" style={{ background: "linear-gradient(145deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, #f59e0b 8%, transparent), transparent 76%)", border: "1px solid color-mix(in srgb, var(--accent) 14%, transparent)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                        Status
                      </p>
                      <p className="text-2xl font-display mt-2" style={{ color: invoice?.status === "paid" ? "var(--accent)" : "var(--warn)" }}>
                        {invoice?.status === "paid" ? "Pembayaran Berhasil" : "Menunggu Pembayaran"}
                      </p>
                      <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                        {invoice?.location?.lotName || "-"} · Slot {invoice?.booking?.slotNumber || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>
                        Total
                      </p>
                      <p className="text-3xl font-display mt-2" style={{ color: "#f59e0b" }}>
                        {formatIDR(invoice?.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Booking",
                      rows: [
                        ["Area", invoice?.location?.lotName || "-"],
                        ["Slot", invoice?.booking?.slotNumber || "-"],
                        ["Kendaraan", invoice?.booking?.vehiclePlate || "-"],
                        ["Mulai", invoice?.booking?.startTime ? formatDateShort(invoice.booking.startTime) : "-"],
                        ["Selesai", invoice?.booking?.endTime ? formatDateShort(invoice.booking.endTime) : "-"],
                      ],
                    },
                    {
                      title: "Pembayaran",
                      rows: [
                        ["Metode", invoice?.paymentType || invoice?.paymentMethod || "-"],
                        ["Transaksi", invoice?.transactionId || "Sandbox / internal"],
                        ["VA", invoice?.vaNumber || "-"],
                        ["Dibayar", invoice?.issuedAt ? formatDateShort(invoice.issuedAt) : "-"],
                      ],
                    },
                  ].map((section) => (
                    <div key={section.title} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                        {section.title}
                      </p>
                      <div className="space-y-2 text-sm">
                        {section.rows.map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-3">
                            <span style={{ color: "var(--text-dim)" }}>{label}</span>
                            <span className="text-right" style={{ color: "var(--text)" }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={handlePrint} className="btn-primary">
                    Cetak Struk
                  </button>
                  <button type="button" onClick={onClose} className="btn-ghost">
                    Selesai
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const { isPetugas, isAdmin } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const [qrTarget, setQrTarget] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [pendingPaymentTarget, setPendingPaymentTarget] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [deletingFinished, setDeletingFinished] = useState(null);
  const [bulkDeletingFinished, setBulkDeletingFinished] = useState(false);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(() => {
    setLoading(true);
    reservationsService
      .list()
      .then((data) => setReservations(data.reservations || []))
      .catch((err) => setError(err.response?.data?.error || "Gagal memuat transaksi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvents({
    "reservation:created": load,
    "reservation:extended": load,
    "reservation:cancelled": load,
    "reservation:completed": load,
  });

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.key,
          tab.key === "all"
            ? reservations.length
            : reservations.filter((item) => item.status === tab.key).length,
        ]),
      ),
    [reservations],
  );

  const paidPayments = reservations.filter((item) => item.payment?.status === "paid");
  const pendingPayments = reservations.filter((item) => item.payment?.status === "pending");
  const filtered = filter === "all" ? reservations : reservations.filter((item) => item.status === filter);

  const handleCancel = async (id) => {
    setConfirmDialog({
      title: "Batalkan transaksi parkir ini?",
      description: "Slot akan dilepas kembali dan transaksi aktif akan dihentikan.",
      confirmLabel: "Ya, batalkan",
      cancelLabel: "Kembali",
      tone: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        setCancelling(id);
        try {
          await reservationsService.cancel(id);
          showToast("Transaksi berhasil dibatalkan");
          load();
        } catch (err) {
          showToast(err.response?.data?.error || "Gagal membatalkan transaksi", "error");
        } finally {
          setCancelling(null);
        }
      },
    });
  };

  const openInvoiceDetail = async (reservationId) => {
    setInvoiceModalOpen(true);
    setInvoiceLoading(true);
    setInvoiceDetail(null);
    try {
      const invoice = await paymentService.getInvoice(reservationId);
      setInvoiceDetail(invoice);
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal memuat struk", "error");
      setInvoiceModalOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDeleteFinished = async (reservation) => {
    const statusLabel =
      reservation.status === "cancelled"
        ? "dibatalkan"
        : reservation.status === "expired"
          ? "kedaluwarsa"
          : "selesai";

    setConfirmDialog({
      title: `Hapus transaksi ${reservation.slotNumber} dari daftar?`,
      description:
        `Transaksi ${statusLabel} akan dihapus dari daftar agar riwayat operasional tetap rapi.`,
      confirmLabel: "Ya, hapus",
      cancelLabel: "Batal",
      tone: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeletingFinished(reservation.id);
        try {
          await reservationsService.deleteFinished(reservation.id);
          showToast(`Transaksi ${statusLabel} berhasil dihapus`);
          load();
        } catch (err) {
          showToast(err.response?.data?.error || "Gagal menghapus transaksi", "error");
        } finally {
          setDeletingFinished(null);
        }
      },
    });
  };

  const handleDeleteAllCompleted = async () => {
    setConfirmDialog({
      title: "Hapus semua riwayat transaksi selesai?",
      description:
        "Semua transaksi dengan status selesai, dibatalkan, atau kedaluwarsa akan dibersihkan dari daftar transaksi saat ini.",
      confirmLabel: "Ya, hapus semua",
      cancelLabel: "Batal",
      tone: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        setBulkDeletingFinished(true);
        try {
          const result = await reservationsService.deleteCompletedReservations();
          showToast(result.message || "Riwayat transaksi selesai berhasil dibersihkan");
          load();
        } catch (err) {
          showToast(err.response?.data?.error || "Gagal membersihkan riwayat transaksi", "error");
        } finally {
          setBulkDeletingFinished(false);
        }
      },
    });
  };

  return (
    <div className="p-4 md:p-6 xl:p-7 w-full max-w-none space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Transaksi Parkir"
        subtitle={
          isPetugas
            ? "Pantau transaksi, buka struk, lanjutkan pembayaran, dan tampilkan QR tiket dari satu layar yang lebih rapi."
            : "Kelola dan pantau transaksi parkir dengan fokus ke status, struk, dan pembayaran."
        }
        badge={isPetugas ? "Petugas" : isAdmin ? "Admin" : "Owner"}
        action={
          <button type="button" onClick={load} className="btn-primary">
            Refresh Data
          </button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard label="Total Transaksi" value={reservations.length} sub="seluruh status" color="#60a5fa" icon="T" />
        <KPICard label="Transaksi Aktif" value={counts.active || 0} sub="sedang berjalan" color="var(--accent)" icon="A" />
        <KPICard label="Pembayaran Lunas" value={paidPayments.length} sub="sudah dibayar" color="#f59e0b" icon="$" />
        <KPICard label="Menunggu Bayar" value={pendingPayments.length} sub="butuh tindak lanjut" color="var(--warn)" icon="M" />
      </div>

      <SectionCard
        title="Daftar Transaksi"
        subtitle="Area, slot, kendaraan, status, dan aksi utama ditampilkan lebih jelas."
        action={
          reservations.some((item) =>
            REMOVABLE_TRANSACTION_STATUSES.includes(item.status),
          ) ? (
            <button
              type="button"
              onClick={handleDeleteAllCompleted}
              disabled={bulkDeletingFinished}
              className="btn-danger px-3 py-2 disabled:opacity-50"
            >
              {bulkDeletingFinished ? "Menghapus..." : "Hapus Riwayat"}
            </button>
          ) : null
        }
      >
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 snap-x snap-mandatory">
          {TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className="px-4 py-2.5 rounded-2xl whitespace-nowrap text-sm font-medium transition-all shrink-0 snap-start"
                style={{
                  background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--text-dim)",
                  border: `1px solid ${active ? "color-mix(in srgb, var(--accent) 24%, transparent)" : "var(--border)"}`,
                }}
              >
                {tab.label} ({counts[tab.key] || 0})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 rounded-[24px] animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl p-5 text-sm" style={{ background: "color-mix(in srgb, var(--danger) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)", color: "var(--danger)" }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="T" title="Belum ada transaksi yang sesuai" subtitle="Coba ubah filter atau tunggu transaksi baru masuk." />
        ) : (
          <div className="space-y-3">
            {filtered.map((reservation) => {
              const paymentTone = getPaymentTone(reservation.payment?.status);
              const paymentMethod = formatPaymentMethod(reservation.payment);
              const isActive = reservation.status === "active";
              const isPendingPayment = reservation.status === "pending_payment";
              const isRemovableHistory = REMOVABLE_TRANSACTION_STATUSES.includes(
                reservation.status,
              );
              const areaName = reservation.slot?.lot?.name || "-";
              const durationLabel = `${reservation.hours || 0} jam`;
              const effectiveRate = reservation.hours
                ? reservation.totalAmount / reservation.hours
                : reservation.slot?.pricePerHour || 0;

              return (
                <div
                  key={reservation.id}
                  className="rounded-[24px] p-4 md:p-5"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                          {areaName}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--surface)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                          Slot {reservation.slotNumber}
                        </span>
                        <StatusDot status={reservation.status} />
                        {reservation.payment && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: paymentTone.bg, color: paymentTone.color, border: "1px solid color-mix(in srgb, var(--border) 90%, transparent)" }}>
                            {paymentTone.label}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p style={{ color: "var(--text-dim)" }}>Kendaraan</p>
                          <p className="mt-1 font-mono font-semibold" style={{ color: "var(--text)" }}>
                            {reservation.vehiclePlate}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-dim)" }}>Lokasi</p>
                          <p className="mt-1" style={{ color: "var(--text)" }}>
                            {reservation.slot?.floor ? `Lantai ${reservation.slot.floor}` : "-"}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-dim)" }}>Waktu</p>
                          <p className="mt-1" style={{ color: "var(--text)" }}>
                            {formatDateShort(reservation.startTime)}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-dim)" }}>Durasi</p>
                          <p className="mt-1" style={{ color: "var(--text)" }}>
                            {durationLabel}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-dim)" }}>Pembayaran</p>
                          <p className="mt-1" style={{ color: "var(--text)" }}>
                            {paymentMethod}
                          </p>
                        </div>
                      </div>

                      {(isPetugas || isAdmin) && reservation.user?.name && (
                        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                          Pemesan: <span style={{ color: "var(--text)" }}>{reservation.user.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="lg:text-right lg:min-w-[220px]">
                      <p className="font-display text-2xl" style={{ color: "var(--accent)" }}>
                        {formatIDR(reservation.totalAmount)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                        {formatIDR(effectiveRate)}/jam · {reservation.payment?.vaNumber ? `VA ${reservation.payment.vaNumber}` : paymentMethod}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4 lg:justify-end">
                        {reservation.payment && (
                          <button type="button" onClick={() => openInvoiceDetail(reservation.id)} className="btn-ghost px-3 py-2">
                            Struk
                          </button>
                        )}
                        {isPendingPayment && (
                          <button type="button" onClick={() => setPendingPaymentTarget(reservation)} className="btn-primary px-3 py-2">
                            Lanjut Bayar
                          </button>
                        )}
                        {isActive && (
                          <button type="button" onClick={() => setQrTarget(reservation)} className="btn-ghost px-3 py-2">
                            QR Tiket
                          </button>
                        )}
                        {isActive && (
                          <button type="button" onClick={() => setExtendTarget(reservation)} className="btn-ghost px-3 py-2">
                            Perpanjang
                          </button>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleCancel(reservation.id)}
                            disabled={cancelling === reservation.id}
                            className="btn-danger px-3 py-2 disabled:opacity-50"
                          >
                            {cancelling === reservation.id ? "Memproses..." : "Batalkan"}
                          </button>
                        )}
                        {isRemovableHistory && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFinished(reservation)}
                            disabled={deletingFinished === reservation.id}
                            className="btn-danger px-3 py-2 disabled:opacity-50"
                          >
                            {deletingFinished === reservation.id ? "Menghapus..." : "Hapus"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {qrTarget && <QRTicketModal reservation={qrTarget} onClose={() => setQrTarget(null)} />}
      {extendTarget && (
        <ExtendModal
          reservation={extendTarget}
          slotPricePerHour={
            extendTarget.hours
              ? extendTarget.totalAmount / extendTarget.hours
              : extendTarget.slot?.pricePerHour || 5000
          }
          onClose={() => setExtendTarget(null)}
          onSuccess={(data) => {
            setExtendTarget(null);
            showToast(`Diperpanjang. Biaya ${formatIDR(data.extraAmount)}`);
            load();
          }}
        />
      )}
      {invoiceModalOpen && (
        <PaymentDetailModal
          invoice={invoiceDetail}
          loading={invoiceLoading}
          onClose={() => {
            setInvoiceModalOpen(false);
            setInvoiceDetail(null);
          }}
        />
      )}
      {pendingPaymentTarget && (
        <PendingPaymentModal
          reservation={pendingPaymentTarget}
          onClose={() => setPendingPaymentTarget(null)}
          onUpdated={() => {
            setPendingPaymentTarget(null);
            load();
          }}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          open={Boolean(confirmDialog)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          tone={confirmDialog.tone}
          loading={Boolean(cancelling) || Boolean(deletingFinished) || bulkDeletingFinished}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}


