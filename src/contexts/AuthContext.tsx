import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, storeId?: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: 'customer' | 'admin', storeId?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapProfileToUser = (authUser: { id: string; email?: string | null }, profile?: any): User => ({
  id: authUser.id,
  name: profile?.name || authUser.email?.split('@')[0] || 'User',
  email: profile?.email || authUser.email || '',
  phone: profile?.phone || '',
  role: profile?.role === 'admin' ? 'admin' : 'customer',
  registeredAt: profile?.registered_at,
  storeId: profile?.store_id || '',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setUser(mapProfileToUser(session.user, profile));
    };

    syncUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => setUser(mapProfileToUser(session.user, profile)));
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, storeId?: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Login failed');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (storeId && profile?.store_id && profile.store_id !== storeId) {
      await supabase.auth.signOut();
      setUser(null);
      return false;
    }

    setUser(mapProfileToUser(data.user, profile));
    return true;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'admin' = 'customer',
    storeId?: string,
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          store_id: storeId || '',
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Signup failed');

    await supabase.from('profiles').upsert({
      user_id: data.user.id,
      name,
      email,
      phone: '',
      role,
      store_id: storeId || '',
    } as never, { onConflict: 'user_id' });

    const mappedUser: User = {
      id: data.user.id,
      name,
      email,
      phone: '',
      role,
      storeId,
      registeredAt: new Date().toISOString(),
    };

    if (data.session) setUser(mappedUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    supabase.auth.signOut();
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    if (Object.keys(dbUpdates).length > 0) {
      supabase.from('profiles').update(dbUpdates as never).eq('user_id', user.id).then();
    }
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
