import { useEffect } from 'react';
// components/ui/index.jsx - Design System Premium

export const ROLE_CONFIG = {
  admin:    { label: 'Admin',   color: '#f59e0b', bg: 'color-mix(in srgb,#f59e0b 12%,transparent)', border: 'color-mix(in srgb,#f59e0b 30%,transparent)', glow: 'color-mix(in srgb,#f59e0b 8%,transparent)',  icon: 'A' },
  operator: { label: 'Petugas', color: '#60a5fa', bg: 'color-mix(in srgb,#60a5fa 12%,transparent)', border: 'color-mix(in srgb,#60a5fa 30%,transparent)', glow: 'color-mix(in srgb,#60a5fa 8%,transparent)',  icon: 'P' },
  user:     { label: 'Owner',   color: 'var(--accent)', bg: 'color-mix(in srgb,var(--accent) 12%,transparent)', border: 'color-mix(in srgb,var(--accent) 30%,transparent)', glow: 'color-mix(in srgb,var(--accent) 8%,transparent)', icon: 'O' },
};

// ── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action, badge }) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8 animate-fadeUp">
      <div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="font-display text-2xl md:text-3xl" style={{ color: 'var(--text)' }}>{title}</h1>
          {badge && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold animate-scaleIn"
              style={{ background: 'color-mix(in srgb,var(--accent) 12%,transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb,var(--accent) 25%,transparent)' }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// ── KPICard — with spring hover + number glow ────────────────────────────────
export function KPICard({ label, value, sub, color, icon, trend, delay = 0 }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 animate-fadeUp group"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        animationDelay: `${delay}ms`,
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.18), 0 0 0 1px color-mix(in srgb,${color} 15%,transparent)`;
        e.currentTarget.style.borderColor = `color-mix(in srgb,${color} 30%,transparent)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Glow bg — animates on hover via group */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${color}12 0%, transparent 65%)` }} />

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 relative transition-all duration-300 group-hover:scale-110"
        style={{ background: `color-mix(in srgb,${color} 12%,transparent)`, color }}>
        {icon}
      </div>

      {/* Value */}
      <p className="font-display text-2xl md:text-3xl font-medium relative transition-all duration-200" style={{ color }}>
        {value}
      </p>

      <p className="text-xs mt-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>}

      {trend !== undefined && (
        <div className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: trend >= 0 ? 'color-mix(in srgb,var(--accent) 10%,transparent)' : 'color-mix(in srgb,var(--danger) 10%,transparent)',
            color: trend >= 0 ? 'var(--accent)' : 'var(--danger)',
          }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, icon, action, children, delay = 0, noPadding = false }) {
  return (
    <div className="rounded-2xl animate-fadeUp overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: `${delay}ms`, transition: 'box-shadow 0.3s ease' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'color-mix(in srgb,var(--accent) 10%,transparent)', color: 'var(--accent)' }}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
              {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '◫', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center animate-fadeUp">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 animate-floatSlow"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
        {icon}
      </div>
      <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{title}</p>
      {subtitle && <p className="text-xs mb-4 max-w-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ── RoleBadge ────────────────────────────────────────────────────────────────
export function RoleBadge({ role, size = 'sm' }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full transition-all duration-200 ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, label, sub, showPct = true }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const c   = color || (pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warn)' : 'var(--accent)');
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {label && <span className="text-sm font-medium font-mono" style={{ color: 'var(--text)' }}>{label}</span>}
        <div className="flex items-center gap-2 ml-auto">
          {sub && <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{sub}</span>}
          {showPct && (
            <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color: c, background: `color-mix(in srgb,${c} 10%,transparent)` }}>
              {pct}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, color-mix(in srgb,${c} 70%,transparent))` }} />
      </div>
    </div>
  );
}

// ── StatusDot ────────────────────────────────────────────────────────────────
export function StatusDot({ status }) {
  const map = {
    active:      { color: 'var(--accent)',  label: 'Aktif',      pulse: true  },
    pending_payment: { color: 'var(--warn)', label: 'Menunggu Bayar', pulse: false },
    available:   { color: 'var(--accent)',  label: 'Tersedia',   pulse: true  },
    occupied:    { color: 'var(--danger)',  label: 'Terisi',     pulse: false },
    maintenance: { color: 'var(--warn)',    label: 'Maintenance',pulse: false },
    cancelled:   { color: 'var(--danger)',  label: 'Dibatalkan', pulse: false },
    completed:   { color: 'var(--muted)',   label: 'Selesai',    pulse: false },
    expired:     { color: 'var(--muted)',   label: 'Kadaluarsa', pulse: false },
  };
  const cfg = map[status] || map.completed;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: cfg.color, background: `color-mix(in srgb,${cfg.color} 10%,transparent)`, border: `1px solid color-mix(in srgb,${cfg.color} 20%,transparent)` }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.pulse ? 'animate-pulse2' : ''}`}
        style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, role, size = 'md' }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const sz  = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold uppercase flex-shrink-0 transition-transform duration-200 hover:scale-110`}
      style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}>
      {name?.[0] || '?'}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={{ minHeight: 20, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 space-y-3 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Skeleton style={{ height: 12, width: '55%' }} />
      <Skeleton style={{ height: 36, width: '40%' }} />
      <Skeleton style={{ height: 10, width: '75%' }} />
    </div>
  );
}

// ── Toast — improved ─────────────────────────────────────────────────────────
export function Toast({ msg, type = 'success', onClose }) {
  const cfg = {
    success: { color: 'var(--accent)', icon: '✓', bg: 'color-mix(in srgb,var(--accent) 8%,transparent)' },
    error:   { color: 'var(--danger)', icon: '✕', bg: 'color-mix(in srgb,var(--danger) 8%,transparent)' },
    info:    { color: '#60a5fa',       icon: 'ℹ', bg: 'color-mix(in srgb,#60a5fa 8%,transparent)'       },
    warn:    { color: 'var(--warn)',   icon: '⚠', bg: 'color-mix(in srgb,var(--warn) 8%,transparent)'   },
  }[type] || { color: 'var(--accent)', icon: '✓', bg: '' };

  useEffect(() => {
    if (!onClose) return undefined;
    const timer = setTimeout(() => onClose(), 3200);
    return () => clearTimeout(timer);
  }, [msg, onClose]);

  return (
    <div className="fixed top-16 md:top-5 right-4 md:right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl animate-slideUpFade max-w-sm"
      style={{ background: cfg.bg, border: `1px solid color-mix(in srgb,${cfg.color} 30%,transparent)`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold"
        style={{ background: `color-mix(in srgb,${cfg.color} 15%,transparent)`, color: cfg.color }}>
        {cfg.icon}
      </span>
      <span style={{ color: 'var(--text)' }}>{msg}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto w-5 h-5 flex items-center justify-center rounded-full text-xs transition-all hover:scale-110"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
          ✕
        </button>
      )}
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' }[size];
  return (
    <div className={`${s} rounded-full animate-spin`}
      style={{ border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)' }} />
  );
}

// ── LoaderDots ───────────────────────────────────────────────────────────────
export function LoaderDots() {
  return (
    <div className="loader-dots flex items-center gap-1">
      <span /><span /><span />
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl animate-slideUpFade"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all hover:scale-110"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}



