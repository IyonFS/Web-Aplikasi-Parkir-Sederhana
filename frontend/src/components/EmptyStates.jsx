// components/EmptyStates.jsx
// Ilustrasi SVG kontekstual untuk setiap halaman kosong

// ── SVG Illustrations ──────────────────────────────────────────────────────

function ParkingEmptySVG() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      {/* Ground */}
      <rect x="20" y="130" width="160" height="4" rx="2" fill="var(--border)" opacity="0.5" />
      {/* Parking space lines */}
      {[40, 80, 120].map((x, i) => (
        <g key={i}>
          <rect x={x} y="90" width="36" height="40" rx="3" fill="none"
            stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 2" />
        </g>
      ))}
      {/* Happy car */}
      <g transform="translate(72, 68)">
        {/* Body */}
        <rect x="4" y="14" width="52" height="22" rx="4" fill="var(--accent)" opacity="0.85" />
        {/* Roof */}
        <path d="M12 14 L18 4 L42 4 L48 14" fill="var(--accent)" />
        {/* Windows */}
        <rect x="19" y="6" width="10" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" />
        <rect x="31" y="6" width="10" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" />
        {/* Wheels */}
        <circle cx="14" cy="36" r="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="46" cy="36" r="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="14" cy="36" r="2" fill="var(--muted)" />
        <circle cx="46" cy="36" r="2" fill="var(--muted)" />
        {/* Smile */}
        <path d="M24 22 Q30 26 36 22" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
      {/* Sparkles */}
      {[[30,40],[160,50],[50,20]].map(([x,y],i) => (
        <g key={i} transform={`translate(${x},${y})`} opacity="0.6">
          <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-5" y1="0" x2="5" y2="0" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function BookingEmptySVG() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      {/* Calendar / ticket shape */}
      <rect x="40" y="30" width="120" height="90" rx="10" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Ticket tear */}
      <path d="M40 70 Q55 70 55 80 Q55 90 40 90" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M160 70 Q145 70 145 80 Q145 90 160 90" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="60" y1="80" x2="140" y2="80" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
      {/* QR code mockup */}
      <rect x="75" y="40" width="22" height="22" rx="2" fill="var(--border)" opacity="0.5" />
      <rect x="78" y="43" width="7" height="7" rx="1" fill="var(--muted)" />
      <rect x="87" y="43" width="7" height="7" rx="1" fill="var(--muted)" />
      <rect x="78" y="52" width="7" height="7" rx="1" fill="var(--muted)" />
      <rect x="87" y="50" width="3" height="3" rx="0.5" fill="var(--muted)" />
      <rect x="91" y="54" width="3" height="3" rx="0.5" fill="var(--muted)" />
      {/* Text lines */}
      <rect x="103" y="44" width="40" height="4" rx="2" fill="var(--border)" />
      <rect x="103" y="52" width="28" height="4" rx="2" fill="var(--border)" opacity="0.6" />
      <rect x="103" y="60" width="35" height="4" rx="2" fill="var(--border)" opacity="0.4" />
      {/* Bottom section */}
      <rect x="60" y="92" width="80" height="4" rx="2" fill="var(--border)" opacity="0.4" />
      <rect x="75" y="100" width="50" height="4" rx="2" fill="var(--border)" opacity="0.3" />
      {/* Accent dot */}
      <circle cx="100" cy="70" r="3" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}

function SearchEmptySVG() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      {/* Search glass */}
      <circle cx="88" cy="75" r="40" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="88" cy="75" r="30" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
      {/* Question mark inside */}
      <text x="82" y="84" fontSize="24" fill="var(--muted)" fontFamily="DM Serif Display, Georgia, serif">?</text>
      {/* Handle */}
      <line x1="118" y1="105" x2="148" y2="135" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
      {/* X mark */}
      <g transform="translate(138,125)" opacity="0.5">
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function AnalyticsEmptySVG() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      {/* Axes */}
      <line x1="40" y1="20" x2="40" y2="130" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="130" x2="175" y2="130" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bars — going up */}
      {[
        { x: 58,  h: 30, c: 'var(--accent)', o: 0.3  },
        { x: 88,  h: 55, c: 'var(--accent)', o: 0.5  },
        { x: 118, h: 40, c: 'var(--accent)', o: 0.4  },
        { x: 148, h: 75, c: 'var(--accent)', o: 0.7  },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={130 - b.h} width="22" height={b.h} rx="3"
          fill={b.c} opacity={b.o} />
      ))}
      {/* Question marks on bars */}
      {[58, 88, 118, 148].map((x, i) => (
        <text key={i} x={x + 7} y={130 - [30,55,40,75][i] - 6} fontSize="10"
          fill="var(--muted)" fontFamily="sans-serif">?</text>
      ))}
      {/* Clock icon top right */}
      <circle cx="160" cy="35" r="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="160" y1="35" x2="160" y2="25" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="160" y1="35" x2="167" y2="39" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersEmptySVG() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      {/* 3 user avatars */}
      {[
        { cx: 70,  cy: 70, r: 24, headR: 12, headY: 58 },
        { cx: 100, cy: 65, r: 28, headR: 14, headY: 51 },
        { cx: 130, cy: 70, r: 24, headR: 12, headY: 58 },
      ].map((u, i) => (
        <g key={i}>
          {/* Body */}
          <ellipse cx={u.cx} cy={u.cy + 20} rx={u.r * 0.8} ry={u.r * 0.5}
            fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" opacity={i === 1 ? 1 : 0.7} />
          {/* Head */}
          <circle cx={u.cx} cy={u.headY} r={u.headR}
            fill="var(--surface)" stroke={i === 1 ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={i === 1 ? 2 : 1.5} opacity={i === 1 ? 1 : 0.7} />
          {/* Face */}
          <circle cx={u.cx - 3} cy={u.headY - 2} r="1.5" fill="var(--muted)" />
          <circle cx={u.cx + 3} cy={u.headY - 2} r="1.5" fill="var(--muted)" />
          <path d={`M${u.cx - 4} ${u.headY + 3} Q${u.cx} ${u.headY + 6} ${u.cx + 4} ${u.headY + 3}`}
            stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      ))}
      {/* Plus icon */}
      <circle cx="140" cy="110" r="14" fill="var(--accent)" opacity="0.8" />
      <line x1="140" y1="104" x2="140" y2="116" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="134" y1="110" x2="146" y2="110" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Empty State Components ────────────────────────────────────────────────

export function SlotsEmptyState({ onGoToSlots }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeUp">
      <ParkingEmptySVG />
      <h3 className="font-display text-xl mt-4 mb-2" style={{ color: 'var(--text)' }}>
        Belum ada slot tersedia
      </h3>
      <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--text-dim)' }}>
        Coba ubah filter lantai, tipe, atau status slot. Atau refresh untuk update terbaru.
      </p>
      <div className="flex gap-3">
        {onGoToSlots && (
          <button onClick={onGoToSlots}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            ⊞ Lihat Semua Slot
          </button>
        )}
      </div>
    </div>
  );
}

export function ReservationsEmptyState({ onBookNow, filter }) {
  const messages = {
    all:       { title: 'Belum ada booking',     desc: 'Mulai perjalanan pertamamu dengan memesan slot parkir sekarang.' },
    active:    { title: 'Tidak ada booking aktif', desc: 'Kamu belum punya reservasi yang sedang berjalan saat ini.' },
    completed: { title: 'Belum ada yang selesai', desc: 'Booking yang sudah selesai akan muncul di sini.' },
    cancelled: { title: 'Tidak ada pembatalan',   desc: 'Semua reservasimu berjalan lancar. Bagus!' },
  };
  const msg = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeUp">
      <BookingEmptySVG />
      <h3 className="font-display text-xl mt-4 mb-2" style={{ color: 'var(--text)' }}>{msg.title}</h3>
      <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--text-dim)' }}>{msg.desc}</p>
      {filter === 'all' && onBookNow && (
        <button onClick={onBookNow}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          ⊞ Cari Slot Parkir
        </button>
      )}
    </div>
  );
}

export function SearchEmptyState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeUp">
      <SearchEmptySVG />
      <h3 className="font-display text-xl mt-4 mb-2" style={{ color: 'var(--text)' }}>
        Tidak ditemukan
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
        Tidak ada hasil untuk "{query}". Coba kata kunci lain atau hapus filter.
      </p>
    </div>
  );
}

export function AnalyticsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fadeUp">
      <AnalyticsEmptySVG />
      <h3 className="font-display text-lg mt-4 mb-2" style={{ color: 'var(--text)' }}>
        Data belum tersedia
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
        Analytics akan muncul setelah ada aktivitas booking di sistem.
      </p>
    </div>
  );
}

export function UsersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeUp">
      <UsersEmptySVG />
      <h3 className="font-display text-xl mt-4 mb-2" style={{ color: 'var(--text)' }}>
        Belum ada user
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-dim)' }}>
        User yang mendaftar akan muncul di sini. Share link registrasi ke pelanggan.
      </p>
    </div>
  );
}

export function LiveEventEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 animate-pulse2"
        style={{ background: 'color-mix(in srgb,var(--accent) 8%,transparent)', border: '1px solid color-mix(in srgb,var(--accent) 15%,transparent)' }}>
        ⚡
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Menunggu aktivitas…</p>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>Update akan muncul di sini secara real-time</p>
    </div>
  );
}

