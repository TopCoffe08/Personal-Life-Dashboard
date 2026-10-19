import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, timezone: string) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; recoveryToken?: string; info?: string }>;
  resetPassword: (token: string, newPass: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.getCurrentUser()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const res = await api.register({ name, email, password, confirmPassword });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  const updateProfile = async (name: string, timezone: string) => {
    const res = await api.updateProfile({ name, timezone });
    setUser(res.user);
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    await api.changePassword({ oldPassword: oldPass, newPassword: newPass });
  };

  const forgotPassword = async (email: string) => {
    return await api.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPass: string) => {
    await api.resetPassword({ token, newPassword: newPass });
  };

  const deleteAccount = async (password: string) => {
    await api.deleteAccount(password);
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        deleteAccount
      }}
    >
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
