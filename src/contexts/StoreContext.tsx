import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreInfo {
  id: string;
  name: string;
  tagline: string;
  category: string;
  location: string;
  address: string;
  hero_image: string;
  icon: string;
  badge: string;
  color: string;
  admin_user_id: string;
  secret_key: string;
}

export interface StoreCategory {
  id: string;
  store_id: string;
  category_id: string;
  label: string;
  image: string;
  sort_order: number;
}

interface StoreContextType {
  storeId: string;
  store: StoreInfo | null;
  categories: StoreCategory[];
  setStoreId: (id: string) => void;
  updateStore: (updates: Partial<StoreInfo>) => Promise<void>;
  addCategory: (cat: Omit<StoreCategory, 'id'>) => Promise<void>;
  updateCategory: (categoryId: string, updates: Partial<StoreCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refreshStore: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<string>(() => {
    return localStorage.getItem('omnistore-current-store') || '';
  });
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    if (storeId) {
      localStorage.setItem('omnistore-current-store', storeId);
    }
  }, [storeId]);

  const refreshStore = async () => {
    if (!storeId) { setStore(null); return; }
    const { data } = await supabase.from('stores').select('*').eq('id', storeId).maybeSingle();
    if (data) {
      setStore(data as unknown as StoreInfo);
    }
  };

  const refreshCategories = async () => {
    if (!storeId) { setCategories([]); return; }
    const { data } = await supabase.from('store_categories').select('*').eq('store_id', storeId).order('sort_order');
    if (data) {
      setCategories(data.map(c => ({
        id: c.id,
        store_id: c.store_id,
        category_id: c.category_id,
        label: c.label,
        image: c.image,
        sort_order: c.sort_order,
      })));
    }
  };

  useEffect(() => {
    refreshStore();
    refreshCategories();
  }, [storeId]);

  const updateStore = async (updates: Partial<StoreInfo>) => {
    if (!storeId) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.hero_image !== undefined) dbUpdates.hero_image = updates.hero_image;
    if (updates.location !== undefined) dbUpdates.location = updates.location;

    await supabase.from('stores').update(dbUpdates).eq('id', storeId);
    setStore(prev => prev ? { ...prev, ...updates } : null);
  };

  const addCategory = async (cat: Omit<StoreCategory, 'id'>) => {
    const { data } = await supabase.from('store_categories').insert({
      store_id: cat.store_id,
      category_id: cat.category_id,
      label: cat.label,
      image: cat.image,
      sort_order: cat.sort_order,
    }).select().single();
    if (data) {
      setCategories(prev => [...prev, {
        id: data.id,
        store_id: data.store_id,
        category_id: data.category_id,
        label: data.label,
        image: data.image,
        sort_order: data.sort_order,
      }]);
    }
  };

  const updateCategory = async (categoryId: string, updates: Partial<StoreCategory>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;
    await supabase.from('store_categories').update(dbUpdates).eq('id', categoryId);
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
  };

  const deleteCategory = async (categoryId: string) => {
    await supabase.from('store_categories').delete().eq('id', categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  return (
    <StoreContext.Provider value={{
      storeId, store, categories, setStoreId,
      updateStore, addCategory, updateCategory, deleteCategory,
      refreshStore, refreshCategories,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
