import { useState } from 'react';
import { Search, Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StockBar } from '@/components/StockBar';
import { useProducts } from '@/contexts/ProductContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types';
import { CATEGORIES } from '@/data/products';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onAddCategory: () => void;
}

export function AdminProductsTab({ onEdit, onDelete, onAdd, onAddCategory }: Props) {
  const { products } = useProducts();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const expandAll = () => setExpandedCategories(new Set(CATEGORIES.map(c => c.id)));
  const collapseAll = () => setExpandedCategories(new Set());

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  // Group by category
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filteredProducts.filter(p => p.category === cat.id),
  })).filter(g => g.items.length > 0);

  // When searching, expand all matching categories automatically
  const effectiveExpanded = search.trim()
    ? new Set(grouped.map(g => g.id))
    : expandedCategories;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={expandAll} className="text-xs">Expand All</Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs">Collapse All</Button>
          <Button variant="outline" size="sm" onClick={onAddCategory} className="gap-1 text-xs">
            <Plus className="h-3 w-3" />Add Category
          </Button>
          <Button size="sm" onClick={onAdd} className="gap-1">
            <Plus className="h-4 w-4" />Add Product
          </Button>
        </div>
      </div>

      {/* Category Accordion */}
      {grouped.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No products found</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(cat => {
            const isOpen = effectiveExpanded.has(cat.id);
            return (
              <div key={cat.id} className="glass-card overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors"
                >
                  <img
                    src={cat.image}
                    alt={t(`cat.${cat.id}`)}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 text-left">
                    <span className="font-semibold capitalize">{t(`cat.${cat.id}`)}</span>
                    <span className="ml-2 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {cat.items.length} item{cat.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Products Table */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="overflow-x-auto border-t">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-secondary/30">
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Image</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">{t('admin.productName')}</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t('admin.price')}</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-36 hidden md:table-cell">{t('admin.stock')}</th>
                              <th className="p-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.items.map(p => (
                              <tr key={p.id} className="border-t hover:bg-secondary/20 transition-colors">
                                <td className="p-3">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-9 h-9 rounded-lg object-cover"
                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                  />
                                </td>
                                <td className="p-3">
                                  <p className="text-sm font-medium">{p.name}</p>
                                  <p className="text-xs text-muted-foreground hidden sm:block">{p.description}</p>
                                </td>
                                <td className="p-3 text-sm hidden sm:table-cell">₹{p.price}</td>
                                <td className="p-3 hidden md:table-cell"><StockBar stock={p.stock} maxStock={p.maxStock} /></td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
