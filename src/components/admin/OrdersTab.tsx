import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Order, PAYMENT_METHOD_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, Check, PackageCheck, Clock, CreditCard, User, Calendar } from 'lucide-react';

export function OrdersTab() {
  const { storeId } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('store_id', storeId).order('ordered_at', { ascending: false });
    if (data) {
      setOrders(data.map(o => ({
        id: o.id,
        userId: o.user_id,
        items: o.items as { productName: string; quantity: number; price: number }[],
        total: Number(o.total),
        date: o.date,
        orderedAt: o.ordered_at,
        status: o.status,
        paymentMethod: (o as any).payment_method || 'cash_on_grab',
        paymentStatus: (o as any).payment_status || 'pending',
        pickupDate: (o as any).pickup_date || '',
        pickupTime: (o as any).pickup_time || '',
        customerUniqueId: (o as any).customer_unique_id || '',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [storeId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status } as any).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    toast.success(`Order ${orderId} marked as ${status}`);
  };

  const filteredOrders = searchId.trim()
    ? orders.filter(o => o.customerUniqueId?.toLowerCase().includes(searchId.toLowerCase()) || o.userId.toLowerCase().includes(searchId.toLowerCase()))
    : orders;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Customer ID..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="glass-card p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{order.id}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.customerUniqueId || order.userId}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-b py-2 space-y-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm">
                    {item.quantity}x {item.productName} — ₹{item.price}
                  </p>
                ))}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span>{PAYMENT_METHOD_LABELS[order.paymentMethod || 'cash_on_grab']}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                {(order.pickupDate || order.pickupTime) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{order.pickupDate} {order.pickupTime}</span>
                  </div>
                )}
              </div>

              {/* Total + Actions */}
              <div className="flex justify-between items-center">
                <p className="font-bold text-primary">Total: ₹{order.total}</p>
                <div className="flex gap-2">
                  {order.status === 'Pending' && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateOrderStatus(order.id, 'Accepted')}>
                      <Check className="h-3 w-3" /> Accept
                    </Button>
                  )}
                  {(order.status === 'Accepted' || order.status === 'Ready for Pickup') && (
                    <Button size="sm" className="gap-1 text-xs" onClick={() => updateOrderStatus(order.id, 'Delivered')}>
                      <PackageCheck className="h-3 w-3" /> Confirm Delivered
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
