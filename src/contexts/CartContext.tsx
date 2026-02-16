import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, Order } from '@/types';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  checkout: () => Order | null;
  buyNow: (product: Product) => Order | null;
  orders: Order[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { updateProduct, products } = useProducts();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('omnistore-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('omnistore-cart', JSON.stringify(items));
  }, [items]);

  const orders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]')
    .filter((o: Order) => o.userId === user?.id);

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const checkout = (): Order | null => {
    if (!user || items.length === 0) return null;
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      items: items.map(i => ({ productName: i.product.name, quantity: i.quantity, price: i.product.price * i.quantity })),
      total,
      date: new Date().toLocaleDateString(),
      orderedAt: new Date().toISOString(),
      status: 'Completed',
    };
    const allOrders = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
    allOrders.push(order);
    localStorage.setItem('omnistore-orders', JSON.stringify(allOrders));
    // Decrease stock for each purchased item
    items.forEach(item => {
      const current = products.find(p => p.id === item.product.id);
      if (current) {
        updateProduct(item.product.id, { stock: Math.max(0, current.stock - item.quantity) });
      }
    });
    clearCart();
    return order;
  };

  const buyNow = (product: Product): Order | null => {
    if (!user || product.stock <= 0) return null;
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      items: [{ productName: product.name, quantity: 1, price: product.price }],
      total: product.price,
      date: new Date().toLocaleDateString(),
      orderedAt: new Date().toISOString(),
      status: 'Completed',
    };
    const allOrders = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
    allOrders.push(order);
    localStorage.setItem('omnistore-orders', JSON.stringify(allOrders));
    const current = products.find(p => p.id === product.id);
    if (current) {
      updateProduct(product.id, { stock: Math.max(0, current.stock - 1) });
    }
    return order;
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, checkout, buyNow, orders }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
