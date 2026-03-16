export type Language = 'en' | 'te' | 'hi' | 'kn';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  stock: number;
  maxStock: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'customer' | 'admin';
  registeredAt?: string;
  storeId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  date: string;
  orderedAt?: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  pickupDate?: string;
  pickupTime?: string;
  customerUniqueId?: string;
  customerName?: string;
  creditLedgerFlag?: boolean;
}

export type PaymentMethod = 'cash_on_grab' | 'credit_ledger' | 'online';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_grab: 'Cash on Grab',
  credit_ledger: 'Credit Ledger',
  online: 'Online Payment',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Accepted: 'bg-blue-100 text-blue-800',
  'Ready for Pickup': 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Completed: 'bg-green-100 text-green-800',
};
