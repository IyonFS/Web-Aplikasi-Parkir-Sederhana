import { useEffect } from 'react';

export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  description,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'auto' });
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const tones = {
    danger: {
      accent: 'var(--danger)',
      bg: 'color-mix(in srgb, var(--danger) 10%, transparent)',
      border: 'color-mix(in srgb, var(--danger) 24%, transparent)',
      badge: 'Tindakan penting',
    },
    warn: {
      accent: 'var(--warn)',
      bg: 'color-mix(in srgb, var(--warn) 10%, transparent)',
      border: 'color-mix(in srgb, var(--warn) 24%, transparent)',
      badge: 'Perlu perhatian',
    },
  };

  const ui = tones[tone] || tones.danger;

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto" style={{ background: 'rgba(5, 10, 20, 0.72)', backdropFilter: 'blur(10px)' }}>
      <div className="min-h-screen flex items-center justify-center p-4" onClick={() => !loading && onClose?.()}>
        <div className="relative z-[131] w-full md:max-w-md rounded-[28px] overflow-hidden max-h-[calc(100vh-32px)] overflow-y-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }} onClick={(event) => event.stopPropagation()}>
          <div className="p-5 md:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ background: ui.bg, color: ui.accent, border: `1px solid ${ui.border}` }}>{ui.badge}</div>
            <h3 className="mt-4 text-xl font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
            {description && <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-dim)' }}>{description}</p>}
          </div>

          <div className="p-5 md:p-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60" style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>{cancelLabel}</button>
            <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: ui.accent, color: '#08131f' }}>
              {loading && <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

