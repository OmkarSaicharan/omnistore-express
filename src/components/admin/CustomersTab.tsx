import { useEffect, useState, useCallback } from 'react';
import { User, Order } from '@/types';
import { motion } from 'framer-motion';
import { Users, ShoppingCart, Package, Clock, RefreshCw } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CartStorageItem {
  product: { id: string; name: string; price: number; image: string };
  quantity: number;
}

export function CustomersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [carts, setCarts] = useState<Record<string, CartStorageItem[]>>({});

  const loadData = useCallback(() => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    const allOrders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');
    const activeCart: CartStorageItem[] = JSON.parse(localStorage.getItem('omnistore-cart') || '[]');
    const session: User | null = JSON.parse(localStorage.getItem('omnistore-session') || 'null');

    const cartMap: Record<string, CartStorageItem[]> = {};
    if (session && activeCart.length > 0) {
      cartMap[session.id] = activeCart;
    }

    setUsers(allUsers.filter(u => u.role !== 'admin'));
    setOrders(allOrders);
    setCarts(cartMap);
  }, []);

  // Load on mount + auto-refresh every 3 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getUserOrders = (userId: string) => orders.filter(o => o.userId === userId);
  const getUserCart = (userId: string) => carts[userId] || [];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Registered Customers ({users.length})</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No customers registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const userOrders = getUserOrders(user.id);
            const userCart = getUserCart(user.id);
            const totalSpent = userOrders.reduce((s, o) => s + o.total, 0);

            return (
              <Accordion type="multiple" key={user.id}>
                <AccordionItem value={user.id} className="glass-card border rounded-xl px-3 sm:px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left w-full pr-2">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{user.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.registeredAt && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> Joined: {formatDate(user.registeredAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 shrink-0">
                        <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs">
                          <Package className="h-3 w-3" /> {userOrders.length}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs">
                          <ShoppingCart className="h-3 w-3" /> {userCart.length}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    {/* Orders Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Package className="h-4 w-4" /> Orders ({userOrders.length})
                        {totalSpent > 0 && (
                          <span className="text-muted-foreground font-normal ml-auto text-xs">
                            Total: ₹{totalSpent}
                          </span>
                        )}
                      </h4>
                      {userOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-1">No orders yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {userOrders.map(order => (
                            <div key={order.id} className="rounded-lg border p-3 bg-secondary/30 space-y-1">
                              <div className="flex justify-between items-start flex-wrap gap-1">
                                <span className="font-mono text-xs font-semibold">{order.id}</span>
                                <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
                              </div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {order.orderedAt ? formatDate(order.orderedAt) : order.date}
                              </p>
                              {order.items.map((item, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  {item.productName} × {item.quantity} — ₹{item.price}
                                </p>
                              ))}
                              <p className="text-xs font-bold text-primary">Total: ₹{order.total}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cart Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4" /> Current Cart ({userCart.length} items)
                      </h4>
                      {userCart.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-1">Cart is empty.</p>
                      ) : (
                        <div className="space-y-2">
                          {userCart.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border">
                              <img src={item.product.image} alt="" className="w-8 h-8 rounded object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.product.name}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                              <span className="text-xs font-medium">₹{item.product.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}