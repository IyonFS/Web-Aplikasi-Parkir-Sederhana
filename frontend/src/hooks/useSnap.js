// hooks/useSnap.js
// Load Midtrans Snap.js script dan buka popup pembayaran

import { useEffect, useRef, useState } from 'react';

const SNAP_URL = {
  sandbox:    'https://app.sandbox.midtrans.com/snap/snap.js',
  production: 'https://app.midtrans.com/snap/snap.js',
};

export function useSnap() {
  const [snapReady, setSnapReady] = useState(false);
  const scriptRef = useRef(null);

  const isProduction = import.meta.env.VITE_MIDTRANS_PRODUCTION === 'true';
  const clientKey    = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
  const isDev        = import.meta.env.DEV;

  useEffect(() => {
    // Kalau sudah ada script, tidak perlu load lagi
    if (document.getElementById('midtrans-snap')) {
      setSnapReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id    = 'midtrans-snap';
    script.src   = isProduction ? SNAP_URL.production : SNAP_URL.sandbox;
    if (clientKey) script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload  = () => setSnapReady(true);
    script.onerror = () => console.warn('Midtrans Snap.js gagal dimuat, aplikasi akan memakai mode simulasi pembayaran.');

    document.head.appendChild(script);
    scriptRef.current = script;

    return () => { /* jangan hapus script saat unmount */ };
  }, [clientKey, isProduction]);

  // Buka Snap popup
  function openSnap(snapToken, { onSuccess, onPending, onError, onClose } = {}) {
    if (!window.snap) {
      console.warn('Snap.js belum tersedia');
      return false;
    }

    window.snap.pay(snapToken, {
      onSuccess(result) {
        if (isDev) console.info('Snap success', result);
        onSuccess?.(result);
      },
      onPending(result) {
        if (isDev) console.info('Snap pending', result);
        onPending?.(result);
      },
      onError(result) {
        console.warn('Snap error', result);
        onError?.(result);
      },
      onClose() {
        if (isDev) console.info('Snap popup ditutup user');
        onClose?.();
      },
    });

    return true;
  }

  return { snapReady, openSnap };
}


