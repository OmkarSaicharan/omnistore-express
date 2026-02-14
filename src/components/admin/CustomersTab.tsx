import { useEffect, useState } from 'react';
import { User, Order } from '@/types';
import { motion } from 'framer-motion';
import { Users, ShoppingCart, Package } from 'lucide-react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface CartStorageItem {
  product: { id: string; name: string; price: number; image: string };
  quantity: number;
}

export function CustomersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [carts, setCarts] = useState<Record<string, CartStorageItem[]>>({});

  // Refresh data from localStorage
  useEffect(() => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('omnistore-users') || '[]');
    const allOrders: Order[] = JSON.parse(localStorage.getItem('omnistore-orders') || '[]');

    // Current active cart (shared single cart in this app)
    const activeCart: CartStorageItem[] = JSON.parse(localStorage.getItem('omnistore-cart') || '[]');

    // Get current session to attribute the cart
    const session: User | null = JSON.parse(localStorage.getItem('omnistore-session') || 'null');

    const cartMap: Record<string, CartStorageItem[]> = {};
    if (session && activeCart.length > 0) {
      cartMap[session.id] = activeCart;
    }

    setUsers(allUsers.filter(u => u.role !== 'admin'));
    setOrders(allOrders);
    setCarts(cartMap);
  }, []);

  const getUserOrders = (userId: string) => orders.filter(o => o.userId === userId);
  const getUserCart = (userId: string) => carts[userId] || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Registered Customers ({users.length})</h2>
      </div>

      {users.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No customers registered yet.
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {users.map(user => {
            const userOrders = getUserOrders(user.id);
            const userCart = getUserCart(user.id);
            const totalSpent = userOrders.reduce((s, o) => s + o.total, 0);

            return (
              <AccordionItem key={user.id} value={user.id} className="glass-card border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 text-left w-full pr-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" /> {userOrders.length}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
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
                        <span className="text-muted-foreground font-normal ml-auto">
                          Total spent: ₹{totalSpent}
                        </span>
                      )}
                    </h4>
                    {userOrders.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-1">No orders yet.</p>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Order ID</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Items</TableHead>
                              <TableHead className="text-xs">Total</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userOrders.map(order => (
                              <TableRow key={order.id}>
                                <TableCell className="text-xs font-mono">{order.id}</TableCell>
                                <TableCell className="text-xs">{order.date}</TableCell>
                                <TableCell className="text-xs">
                                  {order.items.map((item, i) => (
                                    <div key={i}>{item.productName} × {item.quantity}</div>
                                  ))}
                                </TableCell>
                                <TableCell className="text-xs font-medium">₹{order.total}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{order.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Product</TableHead>
                              <TableHead className="text-xs">Qty</TableHead>
                              <TableHead className="text-xs">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userCart.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs flex items-center gap-2">
                                  <img src={item.product.image} alt="" className="w-6 h-6 rounded object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                                  {item.product.name}
                                </TableCell>
                                <TableCell className="text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-xs font-medium">₹{item.product.price * item.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </motion.div>
  );
}
