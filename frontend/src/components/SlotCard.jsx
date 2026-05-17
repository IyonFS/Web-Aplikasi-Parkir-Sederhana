import { useState } from 'react';
import { formatIDR } from '../lib/format';

const typeConfig = {
  standard: { icon: 'P', label: 'Standar', color: 'var(--text-dim)' },
  ev: { icon: 'EV', label: 'EV Charging', color: '#60a5fa' },
  disabled: { icon: 'A', label: 'Difabel', color: 'var(--warn)' },
};

const statusConfig = {
  available: { bar: 'var(--accent)', label: 'Tersedia', dotColor: 'var(--accent)', pulse: true },
  occupied: { bar: 'var(--danger)', label: 'Terisi', dotColor: 'var(--danger)', pulse: false },
  maintenance: { bar: 'var(--warn)', label: 'Maintenance', dotColor: 'var(--warn)', pulse: false },
};

export default function SlotCard({ slot, onReserve, isOperator, onStatusChange, isFlashing }) {
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [pressing, setPressing] = useState(false);

  const tc = typeConfig[slot.type] || typeConfig.standard;
  const sc = statusConfig[slot.status] || statusConfig.occupied;
  const isAvailable = slot.status === 'available';
  const isOccupied = slot.status === 'occupied';
  const isMaintenance = slot.status === 'maintenance';

  function addRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { x, y, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
  }

  const cardStyle = {
    background: 'var(--card)',
    border: `1.5px solid ${
      isFlashing
        ? (isAvailable ? 'color-mix(in srgb,var(--accent) 70%,transparent)' : 'color-mix(in srgb,var(--danger) 70%,transparent)')
        : hovered && isAvailable
        ? 'color-mix(in srgb,var(--accent) 35%,transparent)'
        : 'var(--border)'
    }`,
    transform: isFlashing
      ? 'scale(1.04) translateY(-2px)'
      : hovered
      ? 'scale(1.025) translateY(-3px)'
      : pressing
      ? 'scale(0.98)'
      : 'scale(1) translateY(0)',
    boxShadow: isFlashing
      ? `0 0 24px color-mix(in srgb,${isAvailable ? 'var(--accent)' : 'var(--danger)'} 30%,transparent), 0 8px 24px rgba(0,0,0,0.2)`
      : hovered && isAvailable
      ? '0 12px 32px rgba(0,0,0,0.2), 0 0 0 1px color-mix(in srgb,var(--accent) 12%,transparent)'
      : hovered
      ? '0 8px 24px rgba(0,0,0,0.15)'
      : '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressing(false); }}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
    >
      <div
        className="w-full transition-all duration-300"
        style={{
          height: hovered ? 3 : 2,
          background: `linear-gradient(90deg, ${sc.bar}, color-mix(in srgb,${sc.bar} 60%,transparent))`,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at top, color-mix(in srgb,${sc.bar} 6%,transparent) 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="p-3 flex flex-col gap-2.5 flex-1 relative">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-lg font-bold leading-none transition-all duration-200" style={{ color: hovered ? sc.bar : 'var(--text)' }}>
              {slot.number}
            </span>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
              <span style={{ color: tc.color, display: 'inline-block', transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s' }}>
                {tc.icon}
              </span>
              {tc.label}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-200"
            style={{
              background: `color-mix(in srgb,${sc.dotColor} 10%,transparent)`,
              color: sc.dotColor,
              border: `1px solid color-mix(in srgb,${sc.dotColor} 20%,transparent)`,
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sc.pulse ? 'animate-pulse2' : ''}`} style={{ background: sc.dotColor }} />
            {sc.label}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono transition-all duration-200"
            style={{
              background: hovered ? 'color-mix(in srgb,var(--accent) 8%,transparent)' : 'var(--surface)',
              color: hovered ? 'var(--accent)' : 'var(--text-dim)',
              border: '1px solid var(--border)',
            }}
          >
            Lt. {slot.floor}
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>
            {formatIDR(slot.pricePerHour)}
            <span style={{ color: 'var(--muted)', fontWeight: 400 }}>/jam</span>
          </span>
        </div>

        {isFlashing && (
          <div
            className="text-center text-xs py-1.5 rounded-xl font-semibold animate-scaleIn"
            style={{
              background: isAvailable ? 'color-mix(in srgb,var(--accent) 12%,transparent)' : 'color-mix(in srgb,var(--danger) 12%,transparent)',
              color: isAvailable ? 'var(--accent)' : 'var(--danger)',
              border: `1px solid ${isAvailable ? 'color-mix(in srgb,var(--accent) 25%,transparent)' : 'color-mix(in srgb,var(--danger) 25%,transparent)'}`,
            }}
          >
            {isAvailable ? 'Baru tersedia' : 'Baru diperbarui'}
          </div>
        )}

        <div className="flex gap-1.5 mt-auto">
          {isAvailable && (
            <button
              onClick={(e) => { addRipple(e); onReserve(slot); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold relative overflow-hidden"
              style={{
                background: hovered ? 'var(--accent)' : 'color-mix(in srgb,var(--accent) 85%,transparent)',
                color: '#fff',
                transition: 'all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1)',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {ripples.map((r) => (
                <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, background: 'rgba(255,255,255,0.4)' }} />
              ))}
              Reservasi
            </button>
          )}

          {isOperator && isOccupied && (
            <button
              onClick={() => onStatusChange(slot.id, 'available')}
              className="flex-1 py-2 rounded-xl text-xs transition-all duration-200"
              style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
            >
              Bebaskan
            </button>
          )}

          {isOperator && !isMaintenance && (
            <button
              onClick={() => onStatusChange(slot.id, 'maintenance')}
              className="py-2 px-2.5 rounded-xl text-xs transition-all duration-200"
              style={{ color: 'var(--warn)', border: '1px solid color-mix(in srgb,var(--warn) 25%,transparent)', background: 'transparent' }}
            >
              M
            </button>
          )}

          {isOperator && isMaintenance && (
            <button
              onClick={() => onStatusChange(slot.id, 'available')}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Set Tersedia
            </button>
          )}

          {!isAvailable && !isOperator && (
            <div
              className="flex-1 py-2 rounded-xl text-xs text-center transition-all"
              style={{
                background: isOccupied ? 'color-mix(in srgb,var(--warn) 10%,transparent)' : 'var(--surface)',
                color: isOccupied ? 'var(--warn)' : 'var(--muted)',
                border: `1px solid ${isOccupied ? 'color-mix(in srgb,var(--warn) 25%,transparent)' : 'var(--border)'}`,
              }}
            >
              {isOccupied ? 'Sedang Terisi' : 'Dalam Perawatan'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

