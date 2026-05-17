// components/OnboardingWizard.jsx
// Modal wizard 4 langkah untuk user yang baru pertama kali login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: (name) => `Halo, ${name?.split(' ')[0]}!`,
    subtitle: 'Selamat datang di Hygiopark',
    desc: 'Sistem manajemen parkir pintar yang akan membantu kamu kelola reservasi, pantau slot real-time, dan dapatkan laporan analytics lengkap.',
    visual: 'welcome',
    cta: 'Mulai Kenalan →',
  },
  {
    id: 'slots',
    icon: '⊞',
    title: () => 'Lihat & Pesan Slot',
    subtitle: 'Cara booking pertamamu',
    desc: 'Buka halaman Slot Parkir, pilih slot yang tersedia (warna hijau), klik Reservasi, masukkan plat nomor dan durasi — selesai dalam 10 detik!',
    visual: 'slots',
    cta: 'Lanjut →',
  },
  {
    id: 'qr',
    icon: '◫',
    title: () => 'Tiket QR Digitalmu',
    subtitle: 'Tidak perlu kertas',
    desc: 'Setiap booking menghasilkan QR Code unik. Simpan ke galeri HP atau cetak. Tunjukkan saat masuk dan keluar area parkir.',
    visual: 'qr',
    cta: 'Hampir selesai →',
  },
  {
    id: 'ready',
    icon: '🚀',
    title: () => 'Siap digunakan!',
    subtitle: 'Semua sudah terkonfigurasi',
    desc: 'Akun kamu sudah aktif. Dashboard akan update otomatis saat ada perubahan. Kamu bisa mulai booking slot pertamamu sekarang!',
    visual: 'ready',
    cta: 'Cari Slot Parkir Sekarang',
  },
];

// ── Visual illustrations per step ─────────────────────────────────────────
function StepVisual({ type }) {
  const style = {
    welcome: (
      <div className="relative flex items-center justify-center">
        {/* Logo besar beranimasi */}
        <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl font-display font-bold animate-float"
          style={{ background: 'linear-gradient(135deg,rgba(0,200,150,0.2),rgba(0,163,122,0.1))', border: '2px solid rgba(0,200,150,0.3)', color: '#00c896' }}>
          P
        </div>
        {/* Orbit dots */}
        {[
          { icon: '⚡', angle: 0,   delay: '0s'   },
          { icon: '⊞', angle: 120, delay: '0.5s' },
          { icon: '◫', angle: 240, delay: '1s'   },
        ].map(({ icon, angle, delay }, i) => {
          const rad = (angle - 90) * Math.PI / 180;
          const r   = 68;
          const x   = Math.cos(rad) * r;
          const y   = Math.sin(rad) * r;
          return (
            <div key={i} className="absolute w-10 h-10 rounded-xl flex items-center justify-center text-base animate-float"
              style={{
                left:  `calc(50% + ${x}px - 20px)`,
                top:   `calc(50% + ${y}px - 20px)`,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                animationDelay: delay,
              }}>
              {icon}
            </div>
          );
        })}
      </div>
    ),

    slots: (
      <div className="grid grid-cols-3 gap-2 w-48">
        {[
          { status: 'available', num: 'A01' },
          { status: 'occupied',  num: 'A02' },
          { status: 'available', num: 'A03' },
          { status: 'available', num: 'B01' },
          { status: 'available', num: 'B02' },
          { status: 'maintenance', num: 'B03' },
        ].map((slot, i) => (
          <div key={i}
            className={`rounded-xl p-2 text-center transition-all duration-300 ${i === 0 ? 'scale-110' : ''}`}
            style={{
              background: slot.status === 'available'
                ? 'color-mix(in srgb,var(--accent) 12%,transparent)'
                : slot.status === 'occupied'
                ? 'color-mix(in srgb,var(--danger) 12%,transparent)'
                : 'color-mix(in srgb,var(--warn) 12%,transparent)',
              border: `1.5px solid ${
                slot.status === 'available' ? 'color-mix(in srgb,var(--accent) 30%,transparent)'
                : slot.status === 'occupied' ? 'color-mix(in srgb,var(--danger) 30%,transparent)'
                : 'color-mix(in srgb,var(--warn) 30%,transparent)'
              }`,
              boxShadow: i === 0 ? '0 0 12px rgba(0,200,150,0.25)' : 'none',
            }}>
            <div className="font-mono text-xs font-bold" style={{
              color: slot.status === 'available' ? 'var(--accent)'
                : slot.status === 'occupied' ? 'var(--danger)' : 'var(--warn)',
            }}>{slot.num}</div>
          </div>
        ))}
        {/* Arrow ke slot pertama */}
        <div className="col-span-3 text-center mt-1">
          <span className="text-xs animate-bounce inline-block" style={{ color: 'var(--accent)' }}>
            ↑ Klik untuk booking
          </span>
        </div>
      </div>
    ),

    qr: (
      <div className="flex flex-col items-center gap-3">
        {/* QR code mockup */}
        <div className="w-32 h-32 rounded-2xl p-3 animate-float"
          style={{ background: '#fff', border: '3px solid var(--accent)' }}>
          {/* Fake QR pattern */}
          <div className="w-full h-full grid grid-cols-7 gap-px">
            {Array.from({ length: 49 }, (_, i) => {
              const isCorner = (i < 3 && (Math.floor(i/7) < 3 || Math.floor(i/7) > 3)) ||
                [0,1,2,7,8,9,14,15,16,32,33,34,39,40,41,46,47,48].includes(i);
              return (
                <div key={i} className="rounded-sm"
                  style={{ background: isCorner || Math.random() > 0.55 ? '#0a0f1a' : 'transparent' }} />
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'color-mix(in srgb,var(--accent) 12%,transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb,var(--accent) 25%,transparent)' }}>
            ↓ Simpan
          </div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            🖨 Cetak
          </div>
        </div>
      </div>
    ),

    ready: (
      <div className="relative flex items-center justify-center">
        {/* Checkmark besar */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl animate-scaleIn"
          style={{ background: 'linear-gradient(135deg,rgba(0,200,150,0.2),rgba(0,163,122,0.05))', border: '2px solid rgba(0,200,150,0.4)' }}>
          ✓
        </div>
        {/* Confetti dots */}
        {[
          { color: '#00c896', top: '5%',  left: '20%' },
          { color: '#60a5fa', top: '10%', right: '15%'},
          { color: '#f59e0b', top: '75%', left: '10%' },
          { color: '#f472b6', top: '80%', right: '20%'},
          { color: '#a78bfa', top: '40%', left: '5%'  },
          { color: '#34d399', top: '35%', right: '5%' },
        ].map((d, i) => (
          <div key={i} className="absolute w-3 h-3 rounded-full animate-float"
            style={{ background: d.color, top: d.top, left: d.left, right: d.right, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    ),
  };

  return (
    <div className="flex items-center justify-center h-44">
      {style[type]}
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { showWizard, completeWizard, skipWizard } = useOnboarding();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [step, setStep]     = useState(0);
  const [exiting, setExiting] = useState(false);

  if (!showWizard) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const pct     = ((step + 1) / STEPS.length) * 100;

  function handleNext() {
    if (isLast) {
      setExiting(true);
      setTimeout(() => {
        completeWizard();
        navigate('/app/slots');
      }, 300);
    } else {
      setStep(s => s + 1);
    }
  }

  function handleSkip() {
    setExiting(true);
    setTimeout(() => skipWizard(), 300);
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className={`w-full max-w-md rounded-3xl overflow-hidden transition-all duration-300 ${exiting ? 'scale-95' : 'scale-100'} animate-scaleIn`}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* Progress bar atas */}
        <div className="h-1 w-full" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00c896, #00e5aa)' }} />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 8, height: 8,
                    background: i <= step ? 'var(--accent)' : 'var(--border)',
                  }} />
              ))}
            </div>
            <button onClick={handleSkip} className="text-xs transition-colors px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Lewati
            </button>
          </div>

          {/* Visual */}
          <StepVisual type={current.visual} />

          {/* Text */}
          <div className="text-center mt-6 mb-8">
            <div className="text-3xl mb-3">{current.icon}</div>
            <p className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: 'var(--accent)' }}>
              {current.subtitle}
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--text)' }}>
              {current.title(user?.name)}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: 320, margin: '0 auto' }}>
              {current.desc}
            </p>
          </div>

          {/* CTA */}
          <button onClick={handleNext}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 24px rgba(0,200,150,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,200,150,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,200,150,0.2)'; }}>
            {current.cta}
          </button>

          {/* Step text */}
          <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)' }}>
            Langkah {step + 1} dari {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}


