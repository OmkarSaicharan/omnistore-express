import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, Order } from '@/types';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { supabase } from '@/integrations/supabase/client';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  checkout: () => Promise<Order | null>;
  buyNow: (product: Product) => Promise<Order | null>;
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
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    localStorage.setItem('omnistore-cart', JSON.stringify(items));
  }, [items]);

  // Fetch orders from cloud
  useEffect(() => {
    if (!user) { setOrders([]); return; }
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id);
      if (data) {
        setOrders(data.map(o => ({
          id: o.id,
          userId: o.user_id,
          items: o.items as { productName: string; quantity: number; price: number }[],
          total: Number(o.total),
          date: o.date,
          orderedAt: o.ordered_at,
          status: o.status,
        })));
      }
    };
    fetchOrders();
  }, [user]);

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

  const checkout = async (): Promise<Order | null> => {
    if (!user || items.length === 0) return null;
    const now = new Date().toISOString();
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      items: items.map(i => ({ productName: i.product.name, quantity: i.quantity, price: i.product.price * i.quantity })),
      total,
      date: new Date().toLocaleDateString(),
      orderedAt: now,
      status: 'Completed',
    };

    // Save to cloud
    await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      items: order.items,
      total: order.total,
      date: order.date,
      ordered_at: now,
      status: order.status,
    });

    // Decrease stock
    for (const item of items) {
      const current = products.find(p => p.id === item.product.id);
      if (current) {
        updateProduct(item.product.id, { stock: Math.max(0, current.stock - item.quantity) });
      }
    }

    setOrders(prev => [...prev, order]);
    clearCart();
    return order;
  };

  const buyNow = async (product: Product): Promise<Order | null> => {
    if (!user || product.stock <= 0) return null;
    const now = new Date().toISOString();
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      items: [{ productName: product.name, quantity: 1, price: product.price }],
      total: product.price,
      date: new Date().toLocaleDateString(),
      orderedAt: now,
      status: 'Completed',
    };

    await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      items: order.items,
      total: order.total,
      date: order.date,
      ordered_at: now,
      status: order.status,
    });

    const current = products.find(p => p.id === product.id);
    if (current) {
      updateProduct(product.id, { stock: Math.max(0, current.stock - 1) });
    }

    setOrders(prev => [...prev, order]);
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
