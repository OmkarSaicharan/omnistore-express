import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { BarChart3, Package, AlertTriangle, DollarSign, Pencil, Plus, Trash2 } from 'lucide-react';
import { Product, Order } from '@/types';
import { toast } from 'sonner';
import { CATEGORIES } from '@/data/products';

const emptyForm = { name: '', price: 0, stock: 0, maxStock: 100, image: '', category: 'chips', description: '' };

export default function Admin() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { products, updateProduct, addProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'products'>('dashboard');

  if (!isAdmin) return <Navigate to="/login" replace />;

  const orders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
  const weeklyRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockItems = products.filter(p => (p.stock / p.maxStock) * 100 <= 15);

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      maxStock: product.maxStock,
      image: product.image,
      category: product.category,
      description: product.description,
    });
    setIsAdding(false);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setEditForm(emptyForm);
    setIsAdding(true);
  };

  const saveEdit = () => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, editForm);
    setEditingProduct(null);
    toast.success('Product updated successfully!');
  };

  const saveAdd = () => {
    if (!editForm.name.trim()) { toast.error('Product name is required'); return; }
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      ...editForm,
    };
    addProduct(newProduct);
    setIsAdding(false);
    setEditForm(emptyForm);
    toast.success('Product added successfully!');
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Product deleted!');
  };

  const closeDialog = () => {
    setEditingProduct(null);
    setIsAdding(false);
  };

  const stats = [
    { icon: DollarSign, label: t('admin.weeklyRevenue'), value: `₹${weeklyRevenue}`, color: 'text-success' },
    { icon: Package, label: t('admin.totalInventory'), value: `₹${totalInventoryValue}`, color: 'text-primary' },
    { icon: BarChart3, label: t('admin.totalProducts'), value: products.length, color: 'text-primary' },
    { icon: AlertTriangle, label: t('admin.lowStockItems'), value: lowStockItems.length, color: 'text-destructive' },
  ];

  const dialogOpen = !!editingProduct || isAdding;

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
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Product
              </Button>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-secondary/50">
                      <th className="text-left p-3 text-sm font-semibold">Image</th>
                      <th className="text-left p-3 text-sm font-semibold">{t('admin.productName')}</th>
                      <th className="text-left p-3 text-sm font-semibold">{t('admin.category')}</th>
                      <th className="text-left p-3 text-sm font-semibold">{t('admin.price')}</th>
                      <th className="text-left p-3 text-sm font-semibold w-40">{t('admin.stock')}</th>
                      <th className="p-3 text-sm font-semibold w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                        </td>
                        <td className="p-3 text-sm font-medium">{p.name}</td>
                        <td className="p-3 text-sm text-muted-foreground capitalize">{t(`cat.${p.category}`)}</td>
                        <td className="p-3 text-sm">₹{p.price}</td>
                        <td className="p-3"><StockBar stock={p.stock} maxStock={p.maxStock} /></td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAdding ? 'Add New Product' : t('admin.editProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {editForm.image && (
              <div className="flex justify-center">
                <img src={editForm.image} alt="Preview" className="w-24 h-24 rounded-lg object-cover border"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.productName')}</label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Image URL</label>
              <Input value={editForm.image} onChange={e => setEditForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.category')}</label>
              <Select value={editForm.category} onValueChange={v => setEditForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{t(`cat.${c.id}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.price')} (₹)</label>
                <Input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('admin.stock')}</label>
                <Input type="number" value={editForm.stock} onChange={e => setEditForm(p => ({ ...p, stock: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Stock</label>
              <Input type="number" value={editForm.maxStock} onChange={e => setEditForm(p => ({ ...p, maxStock: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={isAdding ? saveAdd : saveEdit} className="flex-1">
                {isAdding ? 'Add Product' : t('admin.save')}
              </Button>
              <Button variant="outline" onClick={closeDialog} className="flex-1">{t('admin.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
