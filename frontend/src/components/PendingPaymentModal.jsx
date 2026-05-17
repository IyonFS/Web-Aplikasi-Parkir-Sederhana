import { useEffect, useState } from 'react';
import { paymentService } from '../services/payment.service';
import { formatIDR } from '../lib/format';
import { useSnap } from '../hooks/useSnap';

const DEMO_METHODS = [
  { key: 'bank_transfer', provider: 'bca', label: 'BCA VA', group: 'Transfer Bank' },
  { key: 'bank_transfer', provider: 'bni', label: 'BNI VA', group: 'Transfer Bank' },
  { key: 'bank_transfer', provider: 'bri', label: 'BRI VA', group: 'Transfer Bank' },
  { key: 'ewallet', provider: 'gopay', label: 'GoPay', group: 'E-Wallet' },
  { key: 'ewallet', provider: 'shopeepay', label: 'ShopeePay', group: 'E-Wallet' },
  { key: 'credit_card', provider: 'visa', label: 'Kartu', group: 'Kartu' },
  { key: 'qris', provider: 'qris', label: 'QRIS', group: 'QRIS' },
];

export default function PendingPaymentModal({ reservation, onClose, onUpdated }) {
  const { snapReady, openSnap } = useSnap();
  const [payment, setPayment] = useState(reservation.payment || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMethod, setDemoMethod] = useState(DEMO_METHODS[0]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'auto' });

    let active = true;
    paymentService.getStatus(reservation.id).then((data) => { if (active) setPayment(data); }).catch(() => {});
    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [reservation.id]);

  async function handleContinue() {
    setLoading(true);
    setError('');
    try {
      const latest = await paymentService.getStatus(reservation.id);
      setPayment(latest);
      if (latest.snapToken && snapReady) {
        openSnap(latest.snapToken, { onSuccess: () => onUpdated?.(), onPending: () => onUpdated?.(), onClose: () => onUpdated?.() });
        onClose?.();
        return;
      }
      await paymentService.demoConfirm(reservation.id, demoMethod.key, demoMethod.provider);
      onUpdated?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal melanjutkan pembayaran.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError('');
    try {
      await paymentService.cancelPending(reservation.id);
      onUpdated?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membatalkan pembayaran pending.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" style={{ background: 'rgba(6,10,20,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-screen flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="relative z-[121] w-full md:max-w-md rounded-[28px] overflow-hidden max-h-[calc(100vh-32px)] overflow-y-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
          <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--warn)' }}>Pending Payment</p>
              <h3 className="text-xl font-semibold mt-1" style={{ color: 'var(--text)' }}>Lanjutkan pembayaran</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Slot {reservation.slotNumber} · {reservation.vehiclePlate}</p>
            </div>
            <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>Tutup</button>
          </div>

          <div className="p-5 space-y-4">
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb,var(--danger) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--danger) 25%,transparent)', color: 'var(--danger)' }}>{error}</div>}

            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--warn) 10%, transparent), transparent 80%)', border: '1px solid color-mix(in srgb, var(--warn) 18%, transparent)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--warn)' }}>Status</p>
                  <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text)' }}>Menunggu pembayaran</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Booking sudah dibuat, tetapi belum lunas.</p>
                </div>
                <p className="font-display text-2xl" style={{ color: '#f59e0b' }}>{formatIDR(payment?.amount || reservation.totalAmount || 0)}</p>
              </div>
            </div>

            {!payment?.snapToken && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-dim)' }}>Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_METHODS.map((method) => {
                    const active = demoMethod.key === method.key && demoMethod.provider === method.provider;
                    return (
                      <button key={`${method.key}-${method.provider}`} type="button" onClick={() => setDemoMethod(method)} className="text-left rounded-xl px-3 py-2.5" style={{ background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--card)', border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 24%, transparent)' : 'var(--border)'}`, color: active ? 'var(--text)' : 'var(--text-dim)' }}>
                        <p className="text-xs font-semibold">{method.label}</p>
                        <p className="text-[11px] mt-1" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>{method.group}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={handleCancel} disabled={loading} className="btn-ghost" style={{ color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 20%, transparent)' }}>{loading ? 'Memproses...' : 'Batalkan Booking'}</button>
              <button type="button" onClick={handleContinue} disabled={loading} className="btn-primary">{loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

