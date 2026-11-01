import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserInfo } from '../types';
import { authApi, customerApi } from '../services/api';
import { startSignalR, stopSignalR } from '../services/signalr';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  register: (data: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  liveNotice: string | null;
  clearLiveNotice: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem('banksphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('banksphere_token'));
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const hub = startSignalR(
        token,
        (tx) => setLiveNotice(`Transaction processed: ${tx.referenceNumber} ($${tx.amount.toFixed(2)})`),
        (alert) => setLiveNotice(`⚠️ Fraud Alert [${alert.severity}]: ${alert.ruleName} - ${alert.description}`),
        (bal) => setLiveNotice(`Balance updated on account: $${bal.balance.toFixed(2)}`),
        (n) => setLiveNotice(`🔔 ${n.title}: ${n.message}`)
      );

      return () => {
        stopSignalR();
      };
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await authApi.login({ email, password: pass });
      if (res.data.success && res.data.accessToken && res.data.user) {
        localStorage.setItem('banksphere_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('banksphere_refresh', res.data.refreshToken);
        }
        localStorage.setItem('banksphere_user', JSON.stringify(res.data.user));
        setToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await authApi.register(data);
      if (res.data.success && res.data.accessToken && res.data.user) {
        localStorage.setItem('banksphere_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('banksphere_refresh', res.data.refreshToken);
        }
        localStorage.setItem('banksphere_user', JSON.stringify(res.data.user));
        setToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('banksphere_refresh');
    if (refresh) {
      authApi.logout(refresh).catch(() => {});
    }
    localStorage.removeItem('banksphere_token');
    localStorage.removeItem('banksphere_refresh');
    localStorage.removeItem('banksphere_user');
    setToken(null);
    setUser(null);
    stopSignalR();
  };

  const refreshUser = async () => {
    try {
      if (user?.role === 'Customer') {
        const meRes = await customerApi.getMe();
        if (meRes.data) {
          // Keep current user updated
        }
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        liveNotice,
        clearLiveNotice: () => setLiveNotice(null),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
