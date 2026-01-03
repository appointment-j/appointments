import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'APPLICANT' | 'EMPLOYEE';
  language: 'ar' | 'en';
  employeeCode?: string;
  jobTitle?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  balance?: number;
  thisMonthTotal?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { language?: 'ar' | 'en'; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error: any) {
      // Only set user to null if it's a 401 error (unauthorized)
      // Other errors might be temporary network issues
      if (error?.response?.status === 401) {
        localStorage.removeItem('userRole');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { language?: 'ar' | 'en'; phone?: string }) => {
    try {
      const response = await api.patch('/auth/profile', data);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('userRole', response.data.user.role);
    setUser(response.data.user);
  };

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('userRole', response.data.user.role);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

