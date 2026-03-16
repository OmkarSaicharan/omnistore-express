import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const fetchOrders = async () => {
    if (!user || !storeId) { setOrders([]); return; }
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .order('ordered_at', { ascending: false });

    if (data) setOrders(data.map(mapOrder));
  };

  useEffect(() => { fetchOrders(); }, [user, storeId]);

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

  const checkout = async (paymentMethod = 'cash_on_grab', paymentStatus = 'pending', pickupDate = '', pickupTime = ''): Promise<Order | null> => {
    if (!user || items.length === 0 || !storeId) return null;

    const now = new Date().toISOString();
    const custId = generateCustomerUniqueId(user.id);
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      userId: user.id,
      items: items.map(i => ({ productName: i.product.name, quantity: i.quantity, price: i.product.price * i.quantity })),
      total,
      date: new Date().toLocaleDateString(),
      orderedAt: now,
      status: 'Pending',
      paymentMethod,
      paymentStatus,
      pickupDate,
      pickupTime,
      customerUniqueId: custId,
      customerName: user.name,
      creditLedgerFlag: paymentMethod === 'credit_ledger',
    };

    await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      items: order.items,
      total: order.total,
      date: order.date,
      ordered_at: now,
      status: order.status,
      store_id: storeId,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      customer_unique_id: custId,
      credit_ledger_flag: paymentMethod === 'credit_ledger',
    } as never);

    await supabase.from('profiles').update({ customer_unique_id: custId } as never).eq('user_id', user.id);

    for (const item of items) {
      const current = products.find(p => p.id === item.product.id);
      if (current) updateProduct(item.product.id, { stock: Math.max(0, current.stock - item.quantity) });
    }

    setOrders(prev => [order, ...prev]);
    clearCart();
    return order;
  };

  const buyNow = async (product: Product, paymentMethod = 'cash_on_grab', paymentStatus = 'pending', pickupDate = '', pickupTime = ''): Promise<Order | null> => {
    if (!user || product.stock <= 0 || !storeId) return null;

    const now = new Date().toISOString();
    const custId = generateCustomerUniqueId(user.id);
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      userId: user.id,
      items: [{ productName: product.name, quantity: 1, price: product.price }],
      total: product.price,
      date: new Date().toLocaleDateString(),
      orderedAt: now,
      status: 'Pending',
      paymentMethod,
      paymentStatus,
      pickupDate,
      pickupTime,
      customerUniqueId: custId,
      customerName: user.name,
      creditLedgerFlag: paymentMethod === 'credit_ledger',
    };

    await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      items: order.items,
      total: order.total,
      date: order.date,
      ordered_at: now,
      status: order.status,
      store_id: storeId,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      customer_unique_id: custId,
      credit_ledger_flag: paymentMethod === 'credit_ledger',
    } as never);

    await supabase.from('profiles').update({ customer_unique_id: custId } as never).eq('user_id', user.id);

    const current = products.find(p => p.id === product.id);
    if (current) updateProduct(product.id, { stock: Math.max(0, current.stock - 1) });

    setOrders(prev => [order, ...prev]);
    return order;
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
