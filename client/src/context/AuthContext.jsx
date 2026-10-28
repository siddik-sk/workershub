import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data?.user || null);
    setWorkerProfile(data?.workerProfile || null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await authApi.me();
      applySession(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      setWorkerProfile(null);
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await authApi.me();
        if (mounted) applySession(response.data);
      } catch {
        if (mounted) {
          setUser(null);
          setWorkerProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applySession]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setWorkerProfile(null);
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  const login = useCallback(
    async (role, credentials) => {
      const request =
        role === 'worker'
          ? authApi.loginWorker
          : role === 'admin'
            ? authApi.loginAdmin
            : authApi.loginCustomer;
      const response = await request(credentials);
      applySession(response.data);
      return response.data;
    },
    [applySession]
  );

  const registerCustomer = useCallback(
    async (payload) => {
      const response = await authApi.registerCustomer(payload);
      applySession(response.data);
      return response;
    },
    [applySession]
  );

  const registerWorker = useCallback(
    async (formData) => {
      const response = await authApi.registerWorker(formData);
      applySession(response.data);
      return response;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setWorkerProfile(null);
    }
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      workerProfile,
      loading,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      login,
      logout,
      registerCustomer,
      registerWorker,
      refresh,
      updateUser,
      setUser,
      setWorkerProfile,
    }),
    [user, workerProfile, loading, login, logout, registerCustomer, registerWorker, refresh, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
