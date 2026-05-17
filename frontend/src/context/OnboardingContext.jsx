// context/OnboardingContext.jsx
// Track apakah user sudah selesai onboarding + tour fitur

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const OnboardingContext = createContext(null);

const STORAGE_KEY = 'pw_onboarding';

function getStoredState(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(userId, state) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(state));
  } catch {}
}

export function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({
    wizardDone:  false,  // wizard selamat datang sudah selesai
    tourDone:    false,  // feature tour sudah dilihat
    wizardStep:  0,      // step wizard saat ini
  });
  const [showWizard, setShowWizard] = useState(false);
  const [showTour,   setShowTour]   = useState(false);

  // Load state dari localStorage saat user login
  useEffect(() => {
    if (!user) { setShowWizard(false); setShowTour(false); return; }

    const stored = getStoredState(user.id);
    if (!stored) {
      // User baru — belum ada data onboarding
      setState({ wizardDone: false, tourDone: false, wizardStep: 0 });
      // Delay sedikit supaya dashboard sudah render dulu
      const t = setTimeout(() => setShowWizard(true), 800);
      return () => clearTimeout(t);
    } else {
      setState(stored);
      // Kalau wizard sudah selesai tapi tour belum
      if (stored.wizardDone && !stored.tourDone) {
        const t = setTimeout(() => setShowTour(true), 600);
        return () => clearTimeout(t);
      }
    }
  }, [user?.id]);

  // Simpan ke localStorage setiap state berubah
  useEffect(() => {
    if (user?.id) saveState(user.id, state);
  }, [state, user?.id]);

  const completeWizard = useCallback(() => {
    setState(s => ({ ...s, wizardDone: true }));
    setShowWizard(false);
    // Tampilkan tour setelah wizard
    setTimeout(() => setShowTour(true), 600);
  }, []);

  const skipWizard = useCallback(() => {
    setState(s => ({ ...s, wizardDone: true, tourDone: true }));
    setShowWizard(false);
    setShowTour(false);
  }, []);

  const completeTour = useCallback(() => {
    setState(s => ({ ...s, tourDone: true }));
    setShowTour(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    if (!user?.id) return;
    localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    setState({ wizardDone: false, tourDone: false, wizardStep: 0 });
    setShowWizard(true);
  }, [user?.id]);

  return (
    <OnboardingContext.Provider value={{
      showWizard, showTour,
      wizardDone: state.wizardDone,
      tourDone:   state.tourDone,
      completeWizard, skipWizard, completeTour, resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);

