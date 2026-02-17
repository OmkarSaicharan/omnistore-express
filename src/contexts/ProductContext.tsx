import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ProductContextType {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductsByCategory: (category: string) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.image,
          category: p.category,
          description: p.description,
          stock: p.stock,
          maxStock: p.max_stock,
        })));
      }
    };
    fetchProducts();
  }, []);

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.maxStock !== undefined) dbUpdates.max_stock = updates.maxStock;

    await supabase.from('products').update(dbUpdates).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addProduct = async (product: Product) => {
    await supabase.from('products').insert({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      stock: product.stock,
      max_stock: product.maxStock,
    });
    setProducts(prev => [...prev, product]);
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductsByCategory = (category: string) => products.filter(p => p.category === category);

  return (
    <ProductContext.Provider value={{ products, updateProduct, addProduct, deleteProduct, getProductsByCategory }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
}
