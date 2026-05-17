import { useState, useEffect } from 'react';
import { paymentService } from '../services/payment.service';
import { formatIDR, calcTotal, validatePlate } from '../lib/format';
import { useSnap } from '../hooks/useSnap';
import { tariffsService } from '../services/tariffs.service';
import { reservationsService } from '../services/reservations.service';

const STEPS = ['Detail', 'Bayar', 'Selesai'];
const DEMO_METHODS = [
  { key: 'bank_transfer', provider: 'bca', label: 'BCA VA', group: 'Transfer Bank' },
  { key: 'bank_transfer', provider: 'bni', label: 'BNI VA', group: 'Transfer Bank' },
  { key: 'bank_transfer', provider: 'bri', label: 'BRI VA', group: 'Transfer Bank' },
  { key: 'ewallet', provider: 'gopay', label: 'GoPay', group: 'E-Wallet' },
  { key: 'ewallet', provider: 'shopeepay', label: 'ShopeePay', group: 'E-Wallet' },
  { key: 'credit_card', provider: 'visa', label: 'Kartu', group: 'Kartu' },
  { key: 'qris', provider: 'qris', label: 'QRIS', group: 'QRIS' },
];
const VEHICLE_TYPE_OPTIONS = [
  { value: 'motorcycle', label: 'Motor' },
  { value: 'car', label: 'Mobil' },
  { value: 'van', label: 'Van' },
  { value: 'bus', label: 'Bus' },
  { value: 'other', label: 'Lainnya' },
];

function labelVehicleType(value) {
  return VEHICLE_TYPE_OPTIONS.find((item) => item.value === value)?.label || value;
}

function InvoicePreview({ invoice, onClose }) {
  if (!invoice) return null;
  const isPaid = invoice.status === 'paid';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: isPaid ? 'color-mix(in srgb,var(--accent) 8%,transparent)' : 'color-mix(in srgb,var(--warn) 8%,transparent)', border: `1px solid color-mix(in srgb,${isPaid ? 'var(--accent)' : 'var(--warn)'} 20%,transparent)` }}>
        <span className="text-3xl">{isPaid ? 'OK' : '...'}</span>
        <div>
          <p className="font-semibold" style={{ color: isPaid ? 'var(--accent)' : 'var(--warn)' }}>{isPaid ? 'Transaksi Berhasil' : 'Menunggu Pembayaran'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="rounded-2xl p-4 space-y-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { l: 'Slot', v: invoice.booking.slotNumber, accent: true },
          { l: 'Kendaraan', v: invoice.booking.vehiclePlate, mono: true },
          ...(invoice.booking.vehicleType ? [{ l: 'Jenis', v: labelVehicleType(invoice.booking.vehicleType) }] : []),
          { l: 'Mulai', v: new Date(invoice.booking.startTime).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) },
          { l: 'Selesai', v: new Date(invoice.booking.endTime).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) },
          ...(invoice.paymentMethod && invoice.paymentMethod !== 'pending' ? [{ l: 'Metode', v: invoice.paymentType || invoice.paymentMethod }] : []),
          ...(invoice.vaNumber ? [{ l: `VA (${invoice.vaBank?.toUpperCase()})`, v: invoice.vaNumber, mono: true }] : []),
        ].map((row, index) => (
          <div key={index} className="flex justify-between gap-3">
            <span style={{ color: 'var(--text-dim)' }}>{row.l}</span>
            <span className={row.mono ? 'font-mono' : ''} style={{ color: row.accent ? 'var(--accent)' : 'var(--text)' }}>{row.v}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2.5 font-bold text-base" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>Total</span>
          <span style={{ color: 'var(--accent)' }}>{formatIDR(invoice.total)}</span>
        </div>
      </div>

      <button onClick={onClose} className="btn-primary w-full py-3.5" style={{ borderRadius: 14 }}>
        {isPaid ? 'Kembali ke Transaksi' : 'Tutup'}
      </button>
    </div>
  );
}

export default function ReserveModal({ slot, onClose, onSuccess }) {
  const { snapReady, openSnap } = useSnap();
  const [step, setStep] = useState(0);
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [hours, setHours] = useState(2);
  const [plateError, setPlateError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoMethod, setDemoMethod] = useState(DEMO_METHODS[0]);
  const [demoProcessing, setDemoProcessing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [cancellingPending, setCancellingPending] = useState(false);
  const [activeTariff, setActiveTariff] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let active = true;

    tariffsService
      .getActivePrice(vehicleType)
      .then((tariff) => {
        if (active) setActiveTariff(tariff);
      })
      .catch(() => {
        if (active) setActiveTariff(null);
      });

    return () => {
      active = false;
    };
  }, [vehicleType]);

  function closeModalNow() {
    setVisible(false);
    setTimeout(onClose, 260);
  }

  function handleClose() {
    if (step === 1 && reservation?.id) {
      setConfirmClose(true);
      return;
    }
    closeModalNow();
  }

  const pricePerHour = Number(activeTariff?.pricePerHour || slot.pricePerHour || 0);
  const total = calcTotal(hours, pricePerHour);
  const checkoutTotal = reservation?.totalAmount || total;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 3600000);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextPlateError = validatePlate(plate);
    if (nextPlateError) {
      setPlateError(nextPlateError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await paymentService.create(slot.id, plate.trim(), hours, vehicleType);
      setReservation(result.reservation);
      setDemoMode(result.payment.demoMode);
      setStep(1);

      if (result.payment.snapToken && snapReady) {
        openSnap(result.payment.snapToken, {
          onSuccess: async () => handlePaymentComplete(result.reservation.id),
          onPending: () => pollStatus(result.reservation.id),
          onError: () => setError('Pembayaran gagal. Silakan coba lagi.'),
          onClose: () => pollStatus(result.reservation.id, 5),
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat pembayaran. Coba lagi.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  function pollStatus(reservationId, maxAttempts = 20) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const status = await paymentService.getStatus(reservationId);
        if (status.status === 'paid') {
          clearInterval(interval);
          await handlePaymentComplete(reservationId);
        } else if (['failed', 'expired', 'cancelled'].includes(status.status)) {
          clearInterval(interval);
          setError('Pembayaran tidak dilanjutkan atau sudah kedaluwarsa.');
        }
      } catch {
      }
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 3000);
  }

  async function handlePaymentComplete(reservationId) {
    let latestReservation = null;
    try {
      const inv = await paymentService.getInvoice(reservationId);
      setInvoice(inv);
    } catch {
    }
    try {
      const data = await reservationsService.get(reservationId);
      latestReservation = data?.reservation || null;
      if (latestReservation) setReservation(latestReservation);
    } catch {
    }
    setStep(2);
    onSuccess?.(latestReservation || reservation || { id: reservationId, status: 'active' });
  }

  async function handleDemoConfirm() {
    if (!reservation) return;
    setLoading(true);
    setDemoProcessing(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await paymentService.demoConfirm(reservation.id, demoMethod.key, demoMethod.provider);
      await handlePaymentComplete(reservation.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses pembayaran demo.');
    } finally {
      setLoading(false);
      setDemoProcessing(false);
    }
  }

  async function handleCancelPendingPayment() {
    if (!reservation?.id) {
      closeModalNow();
      return;
    }

    setCancellingPending(true);
    setError('');
    try {
      await paymentService.cancelPending(reservation.id);
      closeModalNow();
      onSuccess?.(reservation);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membatalkan pembayaran pending.');
      setConfirmClose(false);
    } finally {
      setCancellingPending(false);
    }
  }

  const demoInstruction = (() => {
    if (demoMethod.key === 'bank_transfer') {
      return {
        title: `Transfer ke Virtual Account ${demoMethod.provider.toUpperCase()}`,
        detail: 'Nomor virtual account akan tampil di invoice setelah pembayaran dikonfirmasi.',
        action: 'Gunakan transfer bank untuk menyelesaikan simulasi pembayaran ini.',
      };
    }
    if (demoMethod.key === 'ewallet') {
      return {
        title: `Bayar dengan ${demoMethod.label}`,
        detail: 'Alur ini meniru konfirmasi e-wallet agar proses pembayaran tetap terasa natural.',
        action: 'Setelah konfirmasi, status booking akan langsung diperbarui menjadi berhasil.',
      };
    }
    if (demoMethod.key === 'credit_card') {
      return {
        title: 'Bayar dengan kartu',
        detail: 'Sistem meniru proses otorisasi kartu dengan hasil cepat tanpa membuka gateway eksternal.',
        action: 'Tekan tombol bayar untuk menyelesaikan simulasi otorisasi kartu.',
      };
    }
    return {
      title: 'Bayar dengan QRIS',
      detail: 'Alur ini meniru proses scan QR sampai status pembayaran diterima sistem.',
      action: 'Tekan tombol bayar setelah simulasi scan selesai.',
    };
  })();

  const paymentMood = demoMethod.key === 'bank_transfer' ? 'Transfer terverifikasi' : demoMethod.key === 'ewallet' ? 'Konfirmasi e-wallet' : demoMethod.key === 'credit_card' ? 'Otorisasi kartu' : 'Scan QRIS';

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" style={{ background: `rgba(0,0,0,${visible ? 0.65 : 0})`, backdropFilter: visible ? 'blur(8px)' : 'none', transition: 'all 0.3s ease' }}>
      <div className="min-h-screen flex items-center justify-center p-4" onClick={step < 2 && !confirmClose ? handleClose : undefined}>
        <div onClick={(e) => e.stopPropagation()} className="relative z-[121] w-full md:max-w-md rounded-[24px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.98)', opacity: visible ? 1 : 0, transition: 'all 0.35s cubic-bezier(0.34,1.2,0.64,1)', boxShadow: '0 24px 60px rgba(0,0,0,0.30)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
          <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', zIndex: 1 }}>
            <div>
              <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>{step === 2 ? 'Transaksi Selesai' : 'Transaksi Parkir'}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Slot <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{slot.number}</span> · Lantai {slot.floor}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, index) => <div key={index} className="h-1.5 rounded-full transition-all duration-300" style={{ width: index === step ? 20 : 8, background: index <= step ? 'var(--accent)' : 'var(--border)' }} />)}
            </div>
          </div>

          <div className="p-5">
            {step === 0 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="px-4 py-3 rounded-xl text-sm font-medium animate-slideUpFade" style={{ background: 'color-mix(in srgb,var(--danger) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--danger) 25%,transparent)', color: 'var(--danger)' }}>{error}</div>}

                <div>
                  <label className="label">Plat Nomor</label>
                  <input className="input font-mono uppercase text-base tracking-wider" placeholder="cth: B 1234 XYZ" value={plate} onChange={(e) => { const value = e.target.value.toUpperCase(); setPlate(value); setPlateError(validatePlate(value) || ''); }} maxLength={12} autoFocus style={plateError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px color-mix(in srgb,var(--danger) 12%,transparent)' } : {}} />
                  {plateError && <p className="text-xs mt-1.5 animate-fadeIn" style={{ color: 'var(--danger)' }}>{plateError}</p>}
                </div>

                <div>
                  <label className="label">Jenis Kendaraan</label>
                  <select className="input w-full" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    {VEHICLE_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2"><label className="label mb-0">Durasi</label><span className="font-display text-xl font-bold" key={hours} style={{ color: 'var(--accent)' }}>{hours} jam</span></div>
                  <input type="range" min={1} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
                  <div className="flex gap-1.5 mt-2.5">
                    {[1, 2, 3, 4, 6, 8, 12].map((item) => (
                      <button key={item} type="button" onClick={() => setHours(item)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ background: hours === item ? 'color-mix(in srgb,var(--accent) 15%,transparent)' : 'var(--surface)', color: hours === item ? 'var(--accent)' : 'var(--muted)', border: `1px solid ${hours === item ? 'color-mix(in srgb,var(--accent) 30%,transparent)' : 'var(--border)'}` }}>
                        {item}j
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-4 space-y-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {[
                    { l: 'Jenis', v: labelVehicleType(vehicleType) },
                    { l: 'Mulai', v: startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
                    { l: 'Selesai', v: endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), accent: true },
                    { l: 'Tarif', v: `${formatIDR(pricePerHour)}/jam x ${hours}j` },
                    { l: 'Sumber harga', v: activeTariff?.name || 'Harga slot default' },
                  ].map((row, index) => <div key={index} className="flex justify-between gap-3"><span style={{ color: 'var(--text-dim)' }}>{row.l}</span><span className="font-mono text-right" style={{ color: row.accent ? 'var(--accent)' : 'var(--text)' }}>{row.v}</span></div>)}
                  <div className="flex justify-between pt-2.5 font-bold" style={{ borderTop: '1px solid var(--border)' }}><span style={{ color: 'var(--text)' }}>Total</span><span className="font-display text-xl" key={total} style={{ color: 'var(--accent)' }}>{formatIDR(total)}</span></div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap"><span className="text-xs" style={{ color: 'var(--muted)' }}>Metode:</span>{['Kartu', 'Transfer', 'GoPay', 'OVO', 'DANA', 'QRIS'].map((method) => <span key={method} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>{method}</span>)}</div>

                <div className="flex gap-3 pt-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                  <button type="button" onClick={handleClose} className="btn-ghost flex-1">Batal</button>
                  <button type="submit" disabled={loading || !!plateError || !plate.trim()} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" style={{ borderRadius: 14 }}>{loading ? <><span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Memproses...</> : `Lanjut Bayar · ${formatIDR(total)}`}</button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg" style={{ background: 'color-mix(in srgb,var(--accent) 10%,transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb,var(--accent) 25%,transparent)' }}>{slot.number}</div>
                    <div className="flex-1"><p className="font-semibold" style={{ color: 'var(--text)' }}>Slot {slot.number} · {hours} jam</p><p className="font-mono text-sm" style={{ color: 'var(--text-dim)' }}>{plate}</p><p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{labelVehicleType(vehicleType)}</p></div>
                    <p className="font-display text-xl" style={{ color: 'var(--accent)' }}>{formatIDR(checkoutTotal)}</p>
                  </div>
                </div>

                {error && <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb,var(--danger) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--danger) 25%,transparent)', color: 'var(--danger)' }}>{error}</div>}

                {confirmClose && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--warn) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 22%, transparent)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tutup pembayaran?</p>
                    <p className="text-xs leading-5" style={{ color: 'var(--text-dim)' }}>Booking ini sudah dibuat sebagai menunggu pembayaran. Anda bisa menutup dan melanjutkan nanti, atau membatalkannya sekarang agar slot kembali tersedia.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button type="button" onClick={closeModalNow} className="btn-ghost">Tutup, lanjut nanti</button>
                      <button type="button" onClick={handleCancelPendingPayment} disabled={cancellingPending} className="text-sm px-4 py-3 rounded-xl font-semibold" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 24%, transparent)' }}>
                        {cancellingPending ? 'Membatalkan...' : 'Batalkan booking'}
                      </button>
                    </div>
                  </div>
                )}

                {demoMode ? (
                  <div className="space-y-4">
                    <div className="rounded-[28px] p-5 space-y-4" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, #f59e0b 9%, transparent), transparent 80%)', border: '1px solid color-mix(in srgb, var(--accent) 14%, transparent)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Pembayaran Simulasi</p>
                          <h3 className="text-xl font-semibold mt-2" style={{ color: 'var(--text)' }}>Pilih metode pembayaran</h3>
                          <p className="text-xs mt-2 leading-5" style={{ color: 'var(--text-dim)' }}>Versi presentasi ini memakai simulasi internal agar alur transaksi dapat didemokan sampai selesai tanpa bergantung pada gateway eksternal.</p>
                        </div>
                        <div className="rounded-2xl px-3 py-2 text-right" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-dim)' }}>Total</p>
                          <p className="font-display text-2xl mt-1" style={{ color: '#f59e0b' }}>{formatIDR(checkoutTotal)}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-dim)' }}>Tahap saat ini</p>
                            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text)' }}>{paymentMood}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                            <span className="w-2 h-2 rounded-full animate-pulse2" style={{ background: 'var(--accent)' }} />
                            Menunggu konfirmasi metode
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Pilih metode pembayaran</p>
                        <div className="grid grid-cols-2 gap-2.5">
                          {DEMO_METHODS.map((method) => {
                            const active = demoMethod.key === method.key && demoMethod.provider === method.provider;
                            return (
                              <button
                                key={`${method.key}-${method.provider}`}
                                type="button"
                                onClick={() => setDemoMethod(method)}
                                className="text-left rounded-2xl px-3.5 py-3 transition-all"
                                style={{ background: active ? 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, #0ea5e9 8%, transparent))' : 'var(--card)', border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 24%, transparent)' : 'var(--border)'}`, color: active ? 'var(--text)' : 'var(--text-dim)', boxShadow: active ? '0 10px 24px rgba(0,0,0,0.14)' : 'none' }}
                              >
                                <p className="text-sm font-semibold">{method.label}</p>
                                <p className="text-[11px] mt-1" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>{method.group}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{demoInstruction.title}</p>
                        <p className="text-xs leading-5" style={{ color: 'var(--text-dim)' }}>{demoInstruction.detail}</p>
                        <p className="text-xs leading-5" style={{ color: 'var(--text)' }}>{demoInstruction.action}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={handleClose} className="btn-ghost flex-1">Tutup</button>
                      <button type="button" onClick={handleDemoConfirm} disabled={loading || demoProcessing} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {loading || demoProcessing ? <><span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Memproses...</> : `Bayar ${formatIDR(checkoutTotal)}`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Gateway pembayaran aktif. Lanjutkan pada jendela pembayaran yang tersedia.</p>
                    <button type="button" onClick={handleClose} className="btn-ghost w-full">Tutup</button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && <InvoicePreview invoice={invoice} onClose={closeModalNow} />}
          </div>
        </div>
      </div>
    </div>
  );
}

