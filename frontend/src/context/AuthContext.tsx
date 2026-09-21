import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: LoginResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('docintel_token');
    const savedUser = localStorage.getItem('docintel_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as LoginResponse;
        if (new Date(parsedUser.expiration) > new Date()) {
          setToken(savedToken);
          setUser(parsedUser);
        } else {
          localStorage.removeItem('docintel_token');
          localStorage.removeItem('docintel_user');
        }
      } catch {
        localStorage.removeItem('docintel_token');
        localStorage.removeItem('docintel_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res);
    localStorage.setItem('docintel_token', res.token);
    localStorage.setItem('docintel_user', JSON.stringify(res));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('docintel_token');
    localStorage.removeItem('docintel_user');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

