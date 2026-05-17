import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product, Order } from '@/types';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { useStore } from './StoreContext';
import { supabase } from '@/integrations/supabase/client';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  checkout: (paymentMethod?: string, paymentStatus?: string, pickupDate?: string, pickupTime?: string) => Promise<Order | null>;
  buyNow: (product: Product, paymentMethod?: string, paymentStatus?: string, pickupDate?: string, pickupTime?: string) => Promise<Order | null>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { updateProduct, products } = useProducts();
  const { storeId } = useStore();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('omnistore-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { setItems([]); }, [storeId]);

  useEffect(() => {
    localStorage.setItem('omnistore-cart', JSON.stringify(items));
  }, [items]);

  const mapOrder = (o: any): Order => ({
    id: o.id,
    userId: o.user_id,
    items: o.items as { productName: string; quantity: number; price: number }[],
    total: Number(o.total),
    date: o.date,
    orderedAt: o.ordered_at,
    status: o.status,
    paymentMethod: o.payment_method || 'cash_on_grab',
    paymentStatus: o.payment_status || 'pending',
    pickupDate: o.pickup_date || '',
    pickupTime: o.pickup_time || '',
    customerUniqueId: o.customer_unique_id || '',
    creditLedgerFlag: o.credit_ledger_flag || false,
  });

  const fetchOrders = useCallback(async () => {
    if (!user || !storeId) { setOrders([]); return; }
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .order('ordered_at', { ascending: false });

    if (data) setOrders(data.map(mapOrder));
  }, [user, storeId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  const generateCustomerUniqueId = (userId: string) => `CUS-${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;

  const callPlaceOrder = async (
    payload: { items: { productId: string; quantity: number }[]; paymentMethod: string; paymentStatus: string; pickupDate: string; pickupTime: string }
  ) => {
    const { data, error } = await supabase.functions.invoke('place-order', {
      body: { storeId, ...payload },
    });
    if (error) throw new Error(error.message || 'Order failed');
    if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'Order failed');
    return data;
  };

  const checkout = async (paymentMethod = 'cash_on_grab', paymentStatus = 'pending', pickupDate = '', pickupTime = ''): Promise<Order | null> => {
    if (!user || items.length === 0 || !storeId) return null;

    try {
      const result = await callPlaceOrder({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod, paymentStatus, pickupDate, pickupTime,
      });

      const placed = result?.order;
      const order: Order = {
        id: placed?.order_id || `ORD-${Date.now()}`,
        userId: user.id,
        items: (placed?.items || []) as { productName: string; quantity: number; price: number }[],
        total: Number(placed?.total ?? total),
        date: new Date().toLocaleDateString(),
        orderedAt: new Date().toISOString(),
        status: 'Pending',
        paymentMethod,
        paymentStatus,
        pickupDate,
        pickupTime,
        customerUniqueId: generateCustomerUniqueId(user.id),
        customerName: user.name,
        creditLedgerFlag: paymentMethod === 'credit_ledger',
      };

      // Refresh local stock from server (authoritative)
      for (const item of items) {
        const current = products.find(p => p.id === item.product.id);
        if (current) updateProduct(item.product.id, { stock: Math.max(0, current.stock - item.quantity) });
      }

      setOrders(prev => [order, ...prev]);
      clearCart();
      return order;
    } catch (e) {
      console.error('Checkout failed:', e);
      throw e;
    }
  };

  const buyNow = async (product: Product, paymentMethod = 'cash_on_grab', paymentStatus = 'pending', pickupDate = '', pickupTime = ''): Promise<Order | null> => {
    if (!user || product.stock <= 0 || !storeId) return null;

    try {
      const result = await callPlaceOrder({
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod, paymentStatus, pickupDate, pickupTime,
      });

      const placed = result?.order;
      const order: Order = {
        id: placed?.order_id || `ORD-${Date.now()}`,
        userId: user.id,
        items: (placed?.items || [{ productName: product.name, quantity: 1, price: product.price }]) as { productName: string; quantity: number; price: number }[],
        total: Number(placed?.total ?? product.price),
        date: new Date().toLocaleDateString(),
        orderedAt: new Date().toISOString(),
        status: 'Pending',
        paymentMethod,
        paymentStatus,
        pickupDate,
        pickupTime,
        customerUniqueId: generateCustomerUniqueId(user.id),
        customerName: user.name,
        creditLedgerFlag: paymentMethod === 'credit_ledger',
      };

      const current = products.find(p => p.id === product.id);
      if (current) updateProduct(product.id, { stock: Math.max(0, current.stock - 1) });

      setOrders(prev => [order, ...prev]);
      return order;
    } catch (e) {
      console.error('Buy now failed:', e);
      throw e;
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, checkout, buyNow, orders, refreshOrders: fetchOrders }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
