import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '../services/api';
import type { User, TokenResponse } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get<User>('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/login', { username, password });
    localStorage.setItem('access_token', res.data.access_token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
