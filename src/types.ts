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
  password: string;
  role: 'customer' | 'admin';
  registeredAt?: string;
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
}
