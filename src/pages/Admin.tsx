import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductContext';
import { useStore } from '@/contexts/StoreContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { BarChart3, Package, AlertTriangle, DollarSign, Plus, Settings, MapPin, Image } from 'lucide-react';
import { Product, Order } from '@/types';
import { toast } from 'sonner';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';

const emptyForm = { name: '', price: 0, stock: 0, maxStock: 100, image: '', category: '', description: '' };
const emptyCategoryForm = { id: '', label: '', image: '' };

export default function Admin() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { products, updateProduct, addProduct, deleteProduct } = useProducts();
  const { storeId, store, categories, updateStore, addCategory, deleteCategory } = useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'products' | 'customers' | 'settings'>('dashboard');

  // Add category dialog
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  // Store settings
  const [storeName, setStoreName] = useState(store?.name || '');
  const [storeAddress, setStoreAddress] = useState(store?.address || '');
  const [storeHeroImage, setStoreHeroImage] = useState(store?.hero_image || '');
  const [storeTagline, setStoreTagline] = useState(store?.tagline || '');

  if (!isAdmin) return <Navigate to={`/store/${storeId}/login`} replace />;

  const orders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
  const weeklyRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockItems = products.filter(p => p.maxStock > 0 && (p.stock / p.maxStock) * 100 <= 15);

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
    setEditForm({ ...emptyForm, category: categories.length > 0 ? categories[0].category_id : '' });
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
    if (!editForm.category) { toast.error('Please select a category'); return; }
    const newProduct: Product = { id: `p-${Date.now()}`, ...editForm };
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

  const handleSaveCategory = async () => {
    if (!categoryForm.id.trim() || !categoryForm.label.trim()) {
      toast.error('Category ID and label are required');
      return;
    }
    await addCategory({
      store_id: storeId,
      category_id: categoryForm.id.toLowerCase().replace(/\s+/g, '-'),
      label: categoryForm.label,
      image: categoryForm.image,
      sort_order: categories.length,
    });
    toast.success(`Category "${categoryForm.label}" added!`);
    setShowAddCategory(false);
    setCategoryForm(emptyCategoryForm);
  };

  const handleDeleteCategory = async (catId: string) => {
    await deleteCategory(catId);
    toast.success('Category deleted!');
  };

  const handleSaveStoreSettings = async () => {
    await updateStore({
      name: storeName,
      address: storeAddress,
      hero_image: storeHeroImage,
      tagline: storeTagline,
    });
    toast.success('Store settings saved!');
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
      <div className="pt-20 sm:pt-24 pb-8 container mx-auto px-3 sm:px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{t('admin.title')}</motion.h1>

        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          {(['dashboard', 'products', 'customers', 'settings'] as const).map(t2 => (
            <button key={t2} onClick={() => {
              setTab(t2);
              if (t2 === 'settings' && store) {
                setStoreName(store.name);
                setStoreAddress(store.address);
                setStoreHeroImage(store.hero_image);
                setStoreTagline(store.tagline);
              }
            }}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tab === t2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}>
              {t2 === 'settings' ? 'Store Settings' : t(`admin.${t2}`)}
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
          <AdminProductsTab
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={openAdd}
            onAddCategory={() => setShowAddCategory(true)}
          />
        )}

        {tab === 'customers' && <CustomersTab />}

        {tab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="glass-card p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Store Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Store Name</label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tagline</label>
                  <Input value={storeTagline} onChange={e => setStoreTagline(e.target.value)} placeholder="Your store tagline" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Store Address
                  </label>
                  <Input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Full store address" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" /> Hero Banner Image URL
                  </label>
                  <Input value={storeHeroImage} onChange={e => setStoreHeroImage(e.target.value)} placeholder="https://..." />
                  {storeHeroImage && (
                    <img src={storeHeroImage} alt="Hero preview" className="mt-2 w-full h-32 object-cover rounded-lg border"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  )}
                </div>
                <Button onClick={handleSaveStoreSettings} className="w-full">Save Store Settings</Button>
              </div>
            </div>

            {/* Categories Management */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Categories</h2>
                <Button size="sm" onClick={() => setShowAddCategory(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Category
                </Button>
              </div>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">No categories yet. Add your first category!</p>
              ) : (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <img src={cat.image} alt={cat.label} className="w-10 h-10 rounded-lg object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.category_id}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Edit/Add Dialog */}
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
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.category_id} value={c.category_id}>{c.label}</SelectItem>
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

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Category ID <span className="text-muted-foreground text-xs">(e.g. fruits)</span></label>
              <Input
                value={categoryForm.id}
                onChange={e => setCategoryForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="fruits"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Display Name</label>
              <Input
                value={categoryForm.label}
                onChange={e => setCategoryForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Fruits & Vegetables"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category Image URL</label>
              <Input
                value={categoryForm.image}
                onChange={e => setCategoryForm(p => ({ ...p, image: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            {categoryForm.image && (
              <div className="flex justify-center">
                <img src={categoryForm.image} alt="Preview" className="w-24 h-24 rounded-lg object-cover border"
                  onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveCategory} className="flex-1">Add Category</Button>
              <Button variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
