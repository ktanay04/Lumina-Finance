import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'lumina_user';

function saveAuthState(user, token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          setToken(parsed.token);
          setUser(parsed.user);
          setAuthToken(parsed.token);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  const login = (payload) => {
    const { token: t, ...rest } = payload;
    const u = {
      _id: rest._id,
      name: rest.name,
      email: rest.email,
      photo: rest.photo || null,
    };
    setToken(t);
    setUser(u);
    setAuthToken(t);
    saveAuthState(u, t);
  };

  const updateUser = (updates) => {
    setUser((current) => {
      const next = { ...current, ...updates };
      saveAuthState(next, token);
      return next;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateUser,
    }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
