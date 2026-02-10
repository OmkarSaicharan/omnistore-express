import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'admin@omnistore.com';
const ADMIN_PASSWORD = 'admin123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omnistore-session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('omnistore-session', JSON.stringify(user));
    else localStorage.removeItem('omnistore-session');
  }, [user]);

  // Seed admin user
  useEffect(() => {
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    if (!users.find(u => u.email === ADMIN_EMAIL)) {
      users.push({ id: 'admin-1', name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
      localStorage.setItem('omnistore-users', JSON.stringify(users));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) { setUser(found); return true; }
    return false;
  };

  const register = (name: string, email: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    if (users.find(u => u.email === email)) return false;
    const newUser: User = { id: `user-${Date.now()}`, name, email, password, role: 'customer' };
    users.push(newUser);
    localStorage.setItem('omnistore-users', JSON.stringify(users));
    setUser(newUser);
    return true;
  };

  const logout = () => setUser(null);

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) { users[idx] = updated; localStorage.setItem('omnistore-users', JSON.stringify(users)); }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
