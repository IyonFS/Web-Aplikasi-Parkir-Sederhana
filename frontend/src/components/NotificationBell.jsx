import { useState, useRef, useEffect } from 'react';
import { useNotif } from '../context/NotifContext';
import { useNavigate } from 'react-router-dom';

const typeConfig = {
  booking_confirmed: { label: 'Sukses', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
  booking_expiring: { label: 'Segera', color: 'var(--warn)', bg: 'color-mix(in srgb, var(--warn) 10%, transparent)' },
  booking_extended: { label: 'Ubah', color: '#60a5fa', bg: 'color-mix(in srgb, #60a5fa 10%, transparent)' },
  booking_cancelled: { label: 'Batal', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' },
  info: { label: 'Info', color: 'var(--text-dim)', bg: 'var(--surface)' },
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function NotificationBell({ compact = false }) {
  const { notifs, unread, markAllRead, removeNotif } = useNotif();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({ top: 48, left: 16 });
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 320;
      const gap = 10;
      const viewportWidth = window.innerWidth;
      const left = Math.min(Math.max(12, rect.right - panelWidth), viewportWidth - panelWidth - 12);
      const top = rect.bottom + gap;
      setPanelStyle({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  function handleOpen() {
    setOpen((o) => !o);
    if (!open && unread > 0) markAllRead();
  }

  function handleNotifClick(notif) {
    if (notif.reservationId) navigate('/app/reservations');
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`relative flex items-center justify-center rounded-lg transition-colors shrink-0 ${compact ? 'w-9 h-9 text-xs' : 'h-8 px-3 text-sm'}`}
        style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', background: 'var(--surface)' }}
        title="Notifikasi"
      >
        {compact ? 'N' : 'Notifikasi'}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: 'var(--danger)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed w-[min(20rem,calc(100vw-1rem))] rounded-xl z-[80] overflow-hidden animate-fadeUp"
          style={{ top: panelStyle.top, left: panelStyle.left, background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>Notifikasi</span>
            {notifs.length > 0 && (
              <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.info;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 60%, transparent)', background: !notif.read ? 'color-mix(in srgb, var(--surface) 70%, transparent)' : 'transparent' }}
                  >
                    <div className="min-w-[52px] h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color, border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)` }}>
                      {cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{notif.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{notif.message}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{timeAgo(notif.ts)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotif(notif.id); }}
                      className="text-xs w-5 h-5 flex items-center justify-center flex-shrink-0"
                      style={{ color: 'var(--muted)' }}
                    >
                      x
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

