import { useEffect, useMemo, useRef, useState } from "react";
import { reservationsService } from "../services/reservations.service";
import { formatIDR, formatDate } from "../lib/format";
import { openPrintWindow } from "../lib/print";

function createMatrix(size, fill = false) {
  return Array.from({ length: size }, () => Array(size).fill(fill));
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function createSeededRandom(seed) {
  let value = seed || 1;
  return () => {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return ((value >>> 0) % 1000) / 1000;
  };
}

function placeFinder(matrix, reserved, startRow, startCol) {
  for (let row = -1; row <= 7; row += 1) {
    for (let col = -1; col <= 7; col += 1) {
      const r = startRow + row;
      const c = startCol + col;
      if (r < 0 || c < 0 || r >= matrix.length || c >= matrix.length) continue;
      reserved[r][c] = true;
      if (row === -1 || col === -1 || row === 7 || col === 7) {
        matrix[r][c] = false;
        continue;
      }
      const isOuter = row === 0 || col === 0 || row === 6 || col === 6;
      const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
      matrix[r][c] = isOuter || isInner;
    }
  }
}

function placeAlignment(matrix, reserved, startRow, startCol) {
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const r = startRow + row;
      const c = startCol + col;
      reserved[r][c] = true;
      const isOuter = row === 0 || col === 0 || row === 4 || col === 4;
      const isCenter = row === 2 && col === 2;
      matrix[r][c] = isOuter || isCenter;
    }
  }
}

function generatePseudoQrMatrix(data) {
  const modules = 29;
  const matrix = createMatrix(modules, false);
  const reserved = createMatrix(modules, false);
  const seed = hashString(data);
  const random = createSeededRandom(seed);

  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, 0, modules - 7);
  placeFinder(matrix, reserved, modules - 7, 0);
  placeAlignment(matrix, reserved, modules - 9, modules - 9);

  for (let index = 8; index < modules - 8; index += 1) {
    const dark = index % 2 === 0;
    matrix[6][index] = dark;
    matrix[index][6] = dark;
    reserved[6][index] = true;
    reserved[index][6] = true;
  }

  for (let index = 0; index < 8; index += 1) {
    if (!reserved[8][index]) {
      matrix[8][index] = ((seed >> index) & 1) === 1;
      reserved[8][index] = true;
    }
    if (!reserved[index][8]) {
      matrix[index][8] = ((seed >> (index + 8)) & 1) === 1;
      reserved[index][8] = true;
    }
  }

  matrix[modules - 8][8] = true;
  reserved[modules - 8][8] = true;

  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (reserved[row][col]) continue;

      const localBias = ((row * 13 + col * 7 + seed) % 11) / 20;
      const checker = (row + col + seed) % 2 === 0 ? 0.08 : -0.06;
      const neighborhood =
        (row > 0 && matrix[row - 1][col] ? 0.12 : 0) +
        (col > 0 && matrix[row][col - 1] ? 0.1 : 0);
      const value = random() + localBias + checker + neighborhood;

      matrix[row][col] = value > 0.58;
    }
  }

  return matrix;
}

function drawPseudoQr(canvas, data) {
  if (!canvas) return "";
  const modules = 29;
  const quietZone = 4;
  const cell = 8;
  const size = (modules + quietZone * 2) * cell;
  const matrix = generatePseudoQrMatrix(data);
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#000000";
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (!matrix[row][col]) continue;
      ctx.fillRect((col + quietZone) * cell, (row + quietZone) * cell, cell, cell);
    }
  }

  return canvas.toDataURL("image/png");
}

export default function QRTicketModal({ reservation, onClose }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [liveReservation, setLiveReservation] = useState(reservation);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    reservationsService
      .getQRToken(reservation.id)
      .then((data) => {
        setLiveReservation(data.reservation || reservation);
        const payload = JSON.stringify({
          type: "Hygiopark_ticket",
          id: reservation.id,
          slot: reservation.slotNumber,
          plate: reservation.vehiclePlate,
          token: data.qrToken,
        });
        const image = drawPseudoQr(canvasRef.current, payload);
        setQrImage(image);
      })
      .catch(() => setError("Gagal memuat QR Code"))
      .finally(() => setLoading(false));

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reservation.id, reservation.slotNumber, reservation.vehiclePlate]);

  const ticketReservation = liveReservation || reservation;
  const isExpired = new Date(ticketReservation.endTime) < new Date();
  const isActive = ticketReservation.status === "active";
  const areaName = ticketReservation.slot?.lot?.name || ticketReservation.lot?.name || "-";
  const statusLabel = !isActive
    ? "Reservasi tidak aktif"
    : isExpired
      ? "Waktu tiket habis"
      : "Tiket siap digunakan";

  const printBody = useMemo(() => {
    if (!qrImage) return "";
    return `
      <section class="ticket-page">
        <div class="ticket-card">
          <div class="ticket-top">
            <div>
              <div class="ticket-brand">Hygiopark</div>
              <h1>Tiket Parkir Digital</h1>
              <p>${statusLabel}</p>
            </div>
            <div class="ticket-chip">#${ticketReservation.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div class="ticket-qr-wrap">
            <img src="${qrImage}" alt="QR Ticket" />
          </div>
          <div class="ticket-grid">
            <div><span>Slot</span><strong>${ticketReservation.slotNumber}</strong></div>
            <div><span>Area</span><strong>${areaName}</strong></div>
            <div><span>Kendaraan</span><strong>${ticketReservation.vehiclePlate}</strong></div>
            <div><span>Total</span><strong>${formatIDR(ticketReservation.totalAmount)}</strong></div>
            <div><span>Masuk</span><strong>${formatDate(ticketReservation.startTime)}</strong></div>
            <div><span>Berlaku sampai</span><strong>${formatDate(ticketReservation.endTime)}</strong></div>
          </div>
          <div class="ticket-note">Tunjukkan tiket ini saat masuk atau keluar area parkir.</div>
        </div>
      </section>`;
  }, [areaName, qrImage, statusLabel, ticketReservation.endTime, ticketReservation.id, ticketReservation.slotNumber, ticketReservation.startTime, ticketReservation.totalAmount, ticketReservation.vehiclePlate]);

  const printStyles = `
    .ticket-page { display:flex; justify-content:center; }
    .ticket-card {
      width: 380px;
      background:#fff;
      border:1px solid #d0d5dd;
      border-radius:24px;
      padding:24px;
      box-shadow:0 12px 40px rgba(16,24,40,.08);
    }
    .ticket-top { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    .ticket-brand { font-size:12px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#0ea37f; }
    .ticket-top h1 { margin:8px 0 4px; font-size:24px; }
    .ticket-top p { margin:0; color:#667085; font-size:13px; }
    .ticket-chip {
      border:1px solid #d0d5dd;
      border-radius:999px;
      padding:8px 12px;
      font-size:11px;
      font-weight:700;
      color:#344054;
    }
    .ticket-qr-wrap { display:flex; justify-content:center; padding:24px 0 18px; }
    .ticket-qr-wrap img { width:220px; height:220px; object-fit:contain; border:10px solid #fff; box-shadow:0 0 0 1px #d0d5dd; }
    .ticket-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 16px; padding-top:8px; }
    .ticket-grid span { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.14em; color:#667085; margin-bottom:6px; }
    .ticket-grid strong { font-size:13px; color:#101828; }
    .ticket-note { margin-top:18px; padding-top:14px; border-top:1px dashed #d0d5dd; font-size:12px; color:#667085; text-align:center; }
    @media print {
      .ticket-card { box-shadow:none; border-color:#111827; }
    }
  `;

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
    >
      <div
        className="min-h-screen flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-[28px] overflow-hidden"
          onClick={(event) => event.stopPropagation()}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="px-5 py-4 flex items-start justify-between gap-3"
            style={{
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)",
            }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--accent)" }}
              >
                Tiket Digital
              </p>
              <h2 className="font-display text-xl mt-1" style={{ color: "var(--text)" }}>
                Tiket Parkir
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                Tunjukkan QR ini saat masuk atau keluar.
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost px-3 py-2"
              type="button"
            >
              Tutup
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium text-center"
              style={{
                background: !isActive
                  ? "color-mix(in srgb, var(--danger) 8%, transparent)"
                  : isExpired
                    ? "color-mix(in srgb, var(--warn) 8%, transparent)"
                    : "color-mix(in srgb, var(--accent) 8%, transparent)",
                border: !isActive
                  ? "1px solid color-mix(in srgb, var(--danger) 22%, transparent)"
                  : isExpired
                    ? "1px solid color-mix(in srgb, var(--warn) 22%, transparent)"
                    : "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                color: !isActive
                  ? "var(--danger)"
                  : isExpired
                    ? "var(--warn)"
                    : "var(--accent)",
              }}
            >
              {statusLabel}
            </div>

            <div
              className="rounded-[26px] p-5 md:p-6"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--surface) 88%, #ffffff 12%) 100%)",
                border: "1px solid var(--border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                    Nomor Tiket
                  </p>
                  <p className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                    #{ticketReservation.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                    color: "var(--accent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  }}
                >
                  {ticketReservation.slotNumber}
                </div>
              </div>

              <div className="flex justify-center">
                {loading ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2px solid var(--border)", borderTopColor: "var(--accent)" }} />
                  </div>
                ) : error ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center rounded-2xl border text-center px-4" style={{ borderColor: "color-mix(in srgb, var(--danger) 22%, transparent)", background: "color-mix(in srgb, var(--danger) 8%, transparent)", color: "var(--danger)" }}>
                    {error}
                  </div>
                ) : (
                  <div className="rounded-2xl p-3 bg-white" style={{ boxShadow: "0 0 0 1px #e5e7eb inset" }}>
                    <canvas ref={canvasRef} className="block bg-white w-[220px] h-[220px]" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
                <div>
                  <p style={{ color: "var(--text-dim)" }}>Area</p>
                  <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{areaName}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-dim)" }}>Kendaraan</p>
                  <p className="mt-1 font-mono" style={{ color: "var(--text)" }}>{ticketReservation.vehiclePlate}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-dim)" }}>Mulai</p>
                  <p className="mt-1" style={{ color: "var(--text)" }}>{formatDate(ticketReservation.startTime)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-dim)" }}>Berlaku Sampai</p>
                  <p className="mt-1" style={{ color: "var(--text)" }}>{formatDate(ticketReservation.endTime)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-dim)" }}>Total</span>
                <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>
                  {formatIDR(ticketReservation.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!qrImage) return;
                  const link = document.createElement("a");
                  link.download = `Hygiopark-${ticketReservation.slotNumber}-${ticketReservation.vehiclePlate}.png`;
                  link.href = qrImage;
                  link.click();
                }}
                disabled={loading || !!error || !qrImage}
                className="btn-ghost"
              >
                Simpan QR
              </button>
              <button
                type="button"
                onClick={() => openPrintWindow({ title: `Tiket-${ticketReservation.slotNumber}`, body: printBody, styles: printStyles })}
                disabled={loading || !!error || !qrImage}
                className="btn-primary"
              >
                Cetak Tiket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


