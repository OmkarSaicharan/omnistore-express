import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { initialProducts } from '@/data/products';

interface ProductContextType {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductsByCategory: (category: string) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('omnistore-products');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('omnistore-products', JSON.stringify(initialProducts));
    return initialProducts;
  });

  useEffect(() => {
    localStorage.setItem('omnistore-products', JSON.stringify(products));
  }, [products]);

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const deleteProduct = (id: string) => {
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
