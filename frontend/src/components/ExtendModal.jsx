import { useEffect, useState } from 'react';
import { reservationsService } from '../services/reservations.service';
import { formatIDR, formatDate, calcTotal } from '../lib/format';
import { tariffsService } from '../services/tariffs.service';

export default function ExtendModal({ reservation, slotPricePerHour, onClose, onSuccess }) {
  const [extraHours, setExtraHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTariff, setActiveTariff] = useState(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    tariffsService
      .getActivePrice(reservation.vehicleType || 'car')
      .then((tariff) => {
        if (mounted) setActiveTariff(tariff);
      })
      .catch(() => {
        if (mounted) setActiveTariff(null);
      });

    return () => {
      mounted = false;
    };
  }, [reservation.vehicleType]);

  const pricePerHour = Number(activeTariff?.pricePerHour || slotPricePerHour || 5000);
  const extraCost = calcTotal(extraHours, pricePerHour);
  const newEndTime = new Date(new Date(reservation.endTime).getTime() + extraHours * 3600000);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await reservationsService.extend(reservation.id, extraHours);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperpanjang reservasi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative z-[121] bg-park-card border border-park-border w-full md:max-w-sm rounded-2xl animate-fadeUp max-h-[calc(100vh-32px)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-park-border">
            <div>
              <h2 className="font-display text-lg text-park-text">Perpanjang Booking</h2>
              <p className="text-park-text-dim text-xs mt-0.5">Slot <span className="font-mono text-park-accent">{reservation.slotNumber}</span></p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all" style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>x</button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-park-surface rounded-xl p-3 border border-park-border text-xs space-y-1.5">
              <div className="flex justify-between text-park-text-dim"><span>Berakhir sekarang</span><span className="font-mono text-park-warn">{formatDate(reservation.endTime)}</span></div>
            </div>

            <div>
              <label className="label">Tambah durasi: <span className="text-park-accent font-mono">{extraHours} jam</span></label>
              <input type="range" min={1} max={12} value={extraHours} onChange={(e) => setExtraHours(Number(e.target.value))} className="w-full accent-park-accent mt-1" />
              <div className="flex justify-between text-xs text-park-muted mt-1"><span>1 jam</span><span>12 jam</span></div>
            </div>

            <div className="bg-park-surface rounded-xl p-4 border border-park-border space-y-2 text-sm">
              <div className="flex justify-between text-park-text-dim"><span>Berlaku hingga</span><span className="font-mono text-park-accent text-xs">{newEndTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, {newEndTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span></div>
              <div className="flex justify-between gap-3 text-park-text-dim"><span>Tarif</span><span className="font-mono text-right text-park-text">{formatIDR(pricePerHour)}/jam x {extraHours}j</span></div>
              <div className="flex justify-between gap-3 text-park-text-dim"><span>Sumber harga</span><span className="font-mono text-right text-park-text">{activeTariff?.name || 'Harga slot default'}</span></div>
              <div className="border-t border-park-border pt-2 flex justify-between font-semibold"><span className="text-park-text">Biaya tambahan</span><span className="font-mono text-park-accent text-lg">{formatIDR(extraCost)}</span></div>
            </div>

            {error && <div className="bg-park-danger/10 border border-park-danger/30 text-park-danger text-sm px-4 py-3 rounded-lg">{error}</div>}

            <div className="flex gap-3 pt-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Batal</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? 'Memproses...' : `Perpanjang · ${formatIDR(extraCost)}`}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

