import { Product } from '@/types';

export const CATEGORIES = [
  { id: 'chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=300&fit=crop' },
  { id: 'chocolates', image: 'https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=400&h=300&fit=crop' },
  { id: 'rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
  { id: 'dhal', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop' },
  { id: 'sugar', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop' },
  { id: 'bread', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop' },
  { id: 'dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop' },
  { id: 'spices', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop' },
];

export const initialProducts: Product[] = [
  // Chips
  { id: 'p1', name: 'Lays Classic Salted', price: 20, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', category: 'chips', description: 'Crispy salted potato chips', stock: 85, maxStock: 100 },
  { id: 'p2', name: 'Kurkure Masala Munch', price: 20, image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=300&h=300&fit=crop', category: 'chips', description: 'Spicy masala puffed snack', stock: 60, maxStock: 100 },
  { id: 'p3', name: 'Uncle Chips Plain', price: 15, image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300&h=300&fit=crop', category: 'chips', description: 'Classic plain potato chips', stock: 12, maxStock: 100 },
  // Chocolates
  { id: 'p4', name: 'Cadbury Dairy Milk', price: 50, image: 'https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=300&h=300&fit=crop', category: 'chocolates', description: 'Smooth milk chocolate bar', stock: 70, maxStock: 100 },
  { id: 'p5', name: '5 Star Chocolate', price: 20, image: 'https://images.unsplash.com/photo-1623660053975-cf75a8be0908?w=300&h=300&fit=crop', category: 'chocolates', description: 'Caramel nougat chocolate', stock: 45, maxStock: 100 },
  { id: 'p6', name: 'KitKat Wafer Bar', price: 40, image: 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=300&h=300&fit=crop', category: 'chocolates', description: 'Crispy wafer in chocolate', stock: 8, maxStock: 100 },
  // Rice
  { id: 'p7', name: 'India Gate Basmati', price: 180, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', category: 'rice', description: 'Premium long grain basmati rice 1kg', stock: 50, maxStock: 100 },
  { id: 'p8', name: 'Sona Masoori Rice', price: 120, image: 'https://images.unsplash.com/photo-1536304993881-460e71366090?w=300&h=300&fit=crop', category: 'rice', description: 'Lightweight everyday rice 1kg', stock: 30, maxStock: 100 },
  { id: 'p9', name: 'Ponni Boiled Rice', price: 100, image: 'https://images.unsplash.com/photo-1594313753328-8090d43e2e10?w=300&h=300&fit=crop', category: 'rice', description: 'Traditional boiled rice 1kg', stock: 22, maxStock: 100 },
  // Dhal
  { id: 'p10', name: 'Toor Dal Premium', price: 140, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=300&fit=crop', category: 'dhal', description: 'Yellow split pigeon peas 1kg', stock: 40, maxStock: 100 },
  { id: 'p11', name: 'Moong Dal Washed', price: 160, image: 'https://images.unsplash.com/photo-1612257416648-ee7a6c533b4f?w=300&h=300&fit=crop', category: 'dhal', description: 'Split green gram 1kg', stock: 55, maxStock: 100 },
  { id: 'p12', name: 'Chana Dal', price: 120, image: 'https://images.unsplash.com/photo-1515543904279-35e48fd9bc25?w=300&h=300&fit=crop', category: 'dhal', description: 'Bengal gram split 1kg', stock: 18, maxStock: 100 },
  // Sugar
  { id: 'p13', name: 'India Gate Sugar', price: 45, image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=300&fit=crop', category: 'sugar', description: 'Refined white sugar 1kg', stock: 90, maxStock: 100 },
  { id: 'p14', name: 'Uttam Sugar', price: 42, image: 'https://images.unsplash.com/photo-1550411294-098c0d13adbc?w=300&h=300&fit=crop', category: 'sugar', description: 'Fine grain sugar 1kg', stock: 75, maxStock: 100 },
  { id: 'p15', name: 'Organic Jaggery', price: 65, image: 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=300&h=300&fit=crop', category: 'sugar', description: 'Natural jaggery block 500g', stock: 5, maxStock: 100 },
  // Bread
  { id: 'p16', name: 'Britannia White Bread', price: 40, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop', category: 'bread', description: 'Soft white sandwich bread', stock: 35, maxStock: 100 },
  { id: 'p17', name: 'Harvest Gold Wheat', price: 45, image: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&h=300&fit=crop', category: 'bread', description: 'Whole wheat bread loaf', stock: 20, maxStock: 100 },
  { id: 'p18', name: 'Wibs Multigrain', price: 55, image: 'https://images.unsplash.com/photo-1586444248879-bc604bc77daa?w=300&h=300&fit=crop', category: 'bread', description: 'Multigrain health bread', stock: 14, maxStock: 100 },
  // Dairy
  { id: 'p19', name: 'Amul Taza Milk 1L', price: 60, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop', category: 'dairy', description: 'Fresh toned milk 1 litre', stock: 65, maxStock: 100 },
  { id: 'p20', name: 'Amul Butter 100g', price: 55, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop', category: 'dairy', description: 'Pasteurized salted butter', stock: 48, maxStock: 100 },
  { id: 'p21', name: 'Amul Paneer 200g', price: 90, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=300&fit=crop', category: 'dairy', description: 'Fresh cottage cheese block', stock: 10, maxStock: 100 },
  // Spices
  { id: 'p22', name: 'MDH Garam Masala', price: 75, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop', category: 'spices', description: 'Aromatic spice blend 100g', stock: 80, maxStock: 100 },
  { id: 'p23', name: 'Everest Turmeric', price: 45, image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&h=300&fit=crop', category: 'spices', description: 'Pure turmeric powder 100g', stock: 62, maxStock: 100 },
  { id: 'p24', name: 'Catch Red Chilli', price: 55, image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=300&h=300&fit=crop', category: 'spices', description: 'Hot red chilli powder 100g', stock: 3, maxStock: 100 },
];
