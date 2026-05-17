import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      const token = authService.getToken();
      const stored = authService.getUser();

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      if (stored && active) {
        setUser(stored);
      }

      try {
        const freshUser = await authService.me();
        if (active) setUser(freshUser);
      } catch {
        authService.logout();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const syncUser = (nextUser) => {
    authService.setUser(nextUser);
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        syncUser,
        isAdmin: user?.role === 'admin',
        isPetugas: user?.role === 'operator' || user?.role === 'admin',
        isOperator: user?.role === 'operator' || user?.role === 'admin',
        isOwner: user?.role === 'user',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

