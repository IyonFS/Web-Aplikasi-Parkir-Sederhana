import { useEffect, useState } from 'react';
import { waitlistService } from '../services/waitlist.service';
import { formatIDR, calcTotal, validatePlate } from '../lib/format';

const STEPS = ['Detail', 'Antrian', 'Selesai'];

export default function WaitlistModal({ slot, onClose, onSuccess }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [plate, setPlate] = useState('');
  const [hours, setHours] = useState(2);
  const [plateError, setPlateError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validatePlate(plate);
    if (validation) {
      setPlateError(validation);
      return;
    }

    setLoading(true);
    setError('');
    setStep(1);
    try {
      const data = await waitlistService.join(slot.id, plate.trim(), hours);
      setResult(data);
      setStep(2);
      onSuccess?.(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal masuk antrian');
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  const isMd = typeof window !== 'undefined' && window.innerWidth >= 768;
  const total = calcTotal(hours, slot.pricePerHour);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{
        background: `rgba(0,0,0,${visible ? 0.65 : 0})`,
        backdropFilter: visible ? 'blur(8px)' : 'none',
        transition: 'all 0.3s ease',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: isMd ? 20 : '20px 20px 0 0',
          transform: visible ? 'translateY(0) scale(1)' : (isMd ? 'translateY(20px) scale(0.96)' : 'translateY(100%)'),
          opacity: visible ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', zIndex: 1 }}>
          <div>
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
              {step === 2 ? 'Masuk Antrian' : 'Smart Queue'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Slot <span className="font-mono font-bold" style={{ color: 'var(--warn)' }}>{slot.number}</span> · Lantai {slot.floor}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === step ? 20 : 8, background: i <= step ? 'var(--warn)' : 'var(--border)' }}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          {step === 0 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb,var(--danger) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--danger) 25%,transparent)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}

              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, color-mix(in srgb,var(--warn) 10%,transparent), transparent)', border: '1px solid color-mix(in srgb,var(--warn) 18%,transparent)' }}>
                <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--warn)' }}>Queue Benefit</p>
                <p className="text-sm leading-6" style={{ color: 'var(--text)' }}>
                  Saat slot penuh, sistem akan mengirim notifikasi real-time ke antrean terdepan dan memberi waktu konfirmasi 5 menit.
                </p>
              </div>

              <div>
                <label className="label">Plat Nomor</label>
                <input
                  className="input font-mono uppercase text-base tracking-wider"
                  placeholder="cth: B 1234 XYZ"
                  value={plate}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setPlate(v);
                    setPlateError(validatePlate(v) || '');
                  }}
                  maxLength={12}
                  autoFocus
                  style={plateError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px color-mix(in srgb,var(--danger) 12%,transparent)' } : {}}
                />
                {plateError && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{plateError}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Perkiraan Durasi</label>
                  <span className="font-display text-xl font-bold" style={{ color: 'var(--warn)' }}>{hours} jam</span>
                </div>
                <input type="range" min={1} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: 'var(--warn)' }} />
                <div className="flex gap-1.5 mt-2.5">
                  {[1, 2, 3, 4, 6, 8, 12].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{
                        background: hours === h ? 'color-mix(in srgb,var(--warn) 15%,transparent)' : 'var(--surface)',
                        color: hours === h ? 'var(--warn)' : 'var(--muted)',
                        border: `1px solid ${hours === h ? 'color-mix(in srgb,var(--warn) 30%,transparent)' : 'var(--border)'}`,
                      }}
                    >
                      {h}j
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Slot target</span><span className="font-mono" style={{ color: 'var(--text)' }}>{slot.number}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Tarif slot</span><span className="font-mono" style={{ color: 'var(--text)' }}>{formatIDR(slot.pricePerHour)}/jam</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Estimasi biaya</span><span className="font-display text-lg" style={{ color: 'var(--warn)' }}>{formatIDR(total)}</span></div>
              </div>

              <div className="flex gap-3 pt-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <button type="button" onClick={handleClose} className="btn-ghost flex-1">Batal</button>
                <button type="submit" disabled={loading || !!plateError || !plate.trim()} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50" style={{ background: 'var(--warn)', color: '#221500' }}>
                  {loading ? 'Memproses...' : 'Masuk Antrian'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5 text-center space-y-4" style={{ background: 'color-mix(in srgb,var(--warn) 7%,transparent)', border: '1px solid color-mix(in srgb,var(--warn) 20%,transparent)' }}>
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl queue-pulse"
                    style={{ background: 'color-mix(in srgb,var(--warn) 14%,transparent)', color: 'var(--warn)' }}>
                    Q
                  </div>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--warn)' }}>Mendaftarkan ke smart queue</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    Sistem sedang menyimpan data antrean dan menyiapkan notifikasi saat slot tersedia.
                  </p>
                </div>
                <div className="flex justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse2" style={{ background: 'var(--warn)' }} />
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse2" style={{ background: 'var(--warn)', animationDelay: '0.15s' }} />
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse2" style={{ background: 'var(--warn)', animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'color-mix(in srgb,var(--warn) 8%,transparent)', border: '1px solid color-mix(in srgb,var(--warn) 20%,transparent)' }}>
                <span className="text-3xl">Q</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--warn)' }}>
                    {result?.created ? 'Berhasil masuk smart queue' : 'Anda sudah ada di antrian'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    Sistem akan memberi notifikasi saat slot tersedia.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl p-4 space-y-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Slot</span><span className="font-mono" style={{ color: 'var(--text)' }}>{slot.number}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Plat nomor</span><span className="font-mono" style={{ color: 'var(--text)' }}>{plate}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Durasi target</span><span style={{ color: 'var(--text)' }}>{hours} jam</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Status</span><span style={{ color: 'var(--warn)' }}>{result?.entry?.status || 'waiting'}</span></div>
              </div>

              <button onClick={handleClose} className="btn-primary w-full py-3.5" style={{ borderRadius: 14 }}>
                Lihat di Reservasi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

