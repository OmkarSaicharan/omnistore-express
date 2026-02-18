import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: 'customer' | 'admin') => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'omkarsaicharan@gmail.com';
const ADMIN_PASSWORD = 'omkar@2004';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omnistore-session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('omnistore-session', JSON.stringify(user));
    else localStorage.removeItem('omnistore-session');
  }, [user]);

  // Seed admin user in cloud DB
  useEffect(() => {
    const seedAdmin = async () => {
      const { data } = await supabase.from('profiles').select('user_id').eq('email', ADMIN_EMAIL).maybeSingle();
      if (!data) {
        await supabase.from('profiles').insert({
          user_id: 'admin-1',
          name: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin',
        });
      }
    };
    seedAdmin();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check localStorage for password (since we store passwords locally for this simple auth)
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      // Also ensure profile exists in cloud
      const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (profile) {
        found.registeredAt = profile.registered_at;
      }
      setUser(found);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string, role: 'customer' | 'admin' = 'customer'): Promise<boolean> => {
    const users: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    if (users.find(u => u.email === email)) return false;

    // Also check cloud
    const { data: existing } = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
    if (existing) return false;

    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();
    const newUser: User = { id: userId, name, email, password, role, registeredAt: now };

    // Save to localStorage (for password-based login)
    users.push(newUser);
    localStorage.setItem('omnistore-users', JSON.stringify(users));

    // Save profile to cloud DB
    await supabase.from('profiles').insert({
      user_id: userId,
      name,
      email,
      role,
    });

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

    // Update cloud profile
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.email) dbUpdates.email = updates.email;
    supabase.from('profiles').update(dbUpdates).eq('user_id', user.id).then();
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
