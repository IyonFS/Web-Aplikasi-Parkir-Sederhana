// components/FeatureTour.jsx
// Tour fitur — highlight UI elements dengan spotlight + tooltip

import { useState, useEffect } from 'react';
import { useOnboarding } from '../context/OnboardingContext';

const TOUR_STEPS = [
  {
    id:      'sidebar-nav',
    target:  '[data-tour="nav-dashboard"]',
    title:   'Navigasi Utama',
    desc:    'Sidebar ini menampilkan semua menu. Dashboard, Slot Parkir, Reservasi, dan Analytics — semuanya di sini.',
    pos:     'right',
  },
  {
    id:      'slot-menu',
    target:  '[data-tour="nav-slots"]',
    title:   'Slot Parkir',
    desc:    'Lihat semua slot tersedia, gunakan denah lantai 2D, atau filter berdasarkan tipe dan lantai.',
    pos:     'right',
  },
  {
    id:      'reservation-menu',
    target:  '[data-tour="nav-reservations"]',
    title:   'Riwayat Booking',
    desc:    'Semua reservasimu ada di sini — aktif, selesai, dan dibatalkan. Bisa perpanjang atau lihat QR tiket.',
    pos:     'right',
  },
  {
    id:      'notif-bell',
    target:  '[data-tour="notif-bell"]',
    title:   'Notifikasi Real-time',
    desc:    'Bell ini akan berbunyi saat booking dikonfirmasi atau 15 menit sebelum waktu parkir habis.',
    pos:     'bottom',
  },
  {
    id:      'theme-toggle',
    target:  '[data-tour="theme-toggle"]',
    title:   'Dark / Light Mode',
    desc:    'Ganti tema sesuai selera kapan saja. Preferensi disimpan otomatis.',
    pos:     'bottom',
  },
  {
    id:      'profile-card',
    target:  '[data-tour="profile-card"]',
    title:   'Profil & Keamanan',
    desc:    'Klik kartu ini untuk edit profil, ganti password, atau lihat riwayat kendaraanmu.',
    pos:     'top',
  },
];

function getElementRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
}

function TooltipBox({ step, rect, onNext, onSkip, stepIdx, totalSteps }) {
  if (!rect) return null;

  const padding  = 12;
  const tipWidth = 280;
  let   style    = {};

  // Kalkulasi posisi tooltip
  if (step.pos === 'right') {
    style = { top: rect.top + rect.height / 2 - 80, left: rect.right + padding };
  } else if (step.pos === 'bottom') {
    style = { top: rect.bottom + padding, left: rect.left + rect.width / 2 - tipWidth / 2 };
  } else if (step.pos === 'top') {
    style = { bottom: window.innerHeight - rect.top + padding, left: rect.left + rect.width / 2 - tipWidth / 2 };
  }

  // Clamp agar tidak keluar layar
  style.left = Math.max(16, Math.min(style.left || 0, window.innerWidth - tipWidth - 16));

  const isLast = stepIdx === totalSteps - 1;

  return (
    <div className="fixed z-[60] animate-fadeUp"
      style={{ width: tipWidth, ...style }}>
      <div className="rounded-2xl p-4 shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--accent)', borderColor: 'color-mix(in srgb,var(--accent) 40%,transparent)' }}>
        {/* Step dots */}
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i <= stepIdx ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        <h4 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{step.title}</h4>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-dim)' }}>{step.desc}</p>

        <div className="flex items-center justify-between">
          <button onClick={onSkip} className="text-xs transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-dim)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
            Lewati tour
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{stepIdx + 1}/{totalSteps}</span>
            <button onClick={onNext}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {isLast ? 'Selesai ✓' : 'Lanjut →'}
            </button>
          </div>
        </div>
      </div>

      {/* Pointer arrow */}
      {step.pos === 'right' && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
          style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid color-mix(in srgb,var(--accent) 40%,transparent)' }} />
      )}
      {step.pos === 'bottom' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid color-mix(in srgb,var(--accent) 40%,transparent)' }} />
      )}
      {step.pos === 'top' && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid color-mix(in srgb,var(--accent) 40%,transparent)' }} />
      )}
    </div>
  );
}

export default function FeatureTour() {
  const { showTour, completeTour } = useOnboarding();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect,    setRect]    = useState(null);

  useEffect(() => {
    if (!showTour) return;

    function measure() {
      const step = TOUR_STEPS[stepIdx];
      if (!step) return;
      const r = getElementRect(step.target);
      setRect(r);
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [showTour, stepIdx]);

  if (!showTour) return null;

  const step    = TOUR_STEPS[stepIdx];
  const isLast  = stepIdx === TOUR_STEPS.length - 1;
  const padding = 6;

  function handleNext() {
    if (isLast) {
      completeTour();
    } else {
      setStepIdx(s => s + 1);
    }
  }

  return (
    <>
      {/* Dark overlay dengan lubang di elemen target */}
      <div className="fixed inset-0 z-[55] pointer-events-none transition-all duration-500"
        style={{
          background: rect
            ? `radial-gradient(ellipse ${rect.width + padding * 2}px ${rect.height + padding * 2}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 0%, rgba(5,10,20,0.8) 100%)`
            : 'rgba(5,10,20,0.7)',
        }} />

      {/* Click blocker (kecuali tombol tour) */}
      <div className="fixed inset-0 z-[54]" onClick={completeTour} />

      {/* Highlight ring di elemen target */}
      {rect && (
        <div className="fixed z-[56] rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top:     rect.top - padding,
            left:    rect.left - padding,
            width:   rect.width + padding * 2,
            height:  rect.height + padding * 2,
            border:  '2px solid var(--accent)',
            boxShadow: '0 0 0 4px color-mix(in srgb,var(--accent) 15%,transparent)',
            animation: 'pulse2 2s ease-in-out infinite',
          }} />
      )}

      {/* Tooltip */}
      <TooltipBox
        step={step}
        rect={rect}
        onNext={handleNext}
        onSkip={completeTour}
        stepIdx={stepIdx}
        totalSteps={TOUR_STEPS.length}
      />
    </>
  );
}

