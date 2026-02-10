import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductContext';
import { StockBar } from '@/components/StockBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { BarChart3, Package, AlertTriangle, DollarSign, Pencil } from 'lucide-react';
import { Product, Order } from '@/types';

export default function Admin() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { products, updateProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0, image: '' });
  const [tab, setTab] = useState<'dashboard' | 'products'>('dashboard');

  if (!isAdmin) return <Navigate to="/login" replace />;

  const orders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockItems = products.filter(p => (p.stock / p.maxStock) * 100 <= 15);

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({ name: product.name, price: product.price, stock: product.stock, image: product.image });
  };

  const saveEdit = () => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, editForm);
    setEditingProduct(null);
  };

  const stats = [
    { icon: DollarSign, label: t('admin.weeklyRevenue'), value: `₹${weeklyRevenue}`, color: 'text-success' },
    { icon: Package, label: t('admin.totalInventory'), value: `₹${totalInventoryValue}`, color: 'text-primary' },
    { icon: BarChart3, label: t('admin.totalProducts'), value: products.length, color: 'text-primary' },
    { icon: AlertTriangle, label: t('admin.lowStockItems'), value: lowStockItems.length, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 container mx-auto px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6">{t('admin.title')}</motion.h1>

        <div className="flex gap-2 mb-6">
          {(['dashboard', 'products'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${tab === t2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {t(`admin.${t2}`)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card p-6">
                <s.icon className={`h-8 w-8 mb-3 ${s.color}`} />
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left p-3 text-sm font-semibold">{t('admin.productName')}</th>
                    <th className="text-left p-3 text-sm font-semibold">{t('admin.category')}</th>
                    <th className="text-left p-3 text-sm font-semibold">{t('admin.price')}</th>
                    <th className="text-left p-3 text-sm font-semibold w-40">{t('admin.stock')}</th>
                    <th className="p-3 text-sm font-semibold w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{p.name}</td>
                      <td className="p-3 text-sm text-muted-foreground capitalize">{t(`cat.${p.category}`)}</td>
                      <td className="p-3 text-sm">₹{p.price}</td>
                      <td className="p-3"><StockBar stock={p.stock} maxStock={p.maxStock} /></td>
                      <td className="p-3">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{t('admin.editProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.productName')}</label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.price')}</label>
              <Input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.stock')}</label>
              <Input type="number" value={editForm.stock} onChange={e => setEditForm(p => ({ ...p, stock: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} className="flex-1">{t('admin.save')}</Button>
              <Button variant="outline" onClick={() => setEditingProduct(null)} className="flex-1">{t('admin.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
