import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Order, PAYMENT_METHOD_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, Check, PackageCheck, CreditCard, User, Calendar, BadgeIndianRupee } from 'lucide-react';

export function OrdersTab() {
  const { storeId } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);

  const mapOrder = (o: any): Order => ({
    id: o.id,
    userId: o.user_id,
    items: o.items as { productName: string; quantity: number; price: number }[],
    total: Number(o.total),
    date: o.date,
    orderedAt: o.ordered_at,
    status: o.status,
    paymentMethod: o.payment_method || 'cash_on_grab',
    paymentStatus: o.payment_status || 'pending',
    pickupDate: o.pickup_date || '',
    pickupTime: o.pickup_time || '',
    customerUniqueId: o.customer_unique_id || '',
    creditLedgerFlag: o.credit_ledger_flag || false,
  });

  const fetchOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('store_id', storeId).order('ordered_at', { ascending: false });
    if (data) setOrders(data.map(mapOrder));
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [storeId]);

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;

    await supabase.from('orders').update(payload as never).eq('id', orderId);
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, ...updates } : order));
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateOrder(orderId, { status });
    toast.success(`Order ${orderId} marked as ${status}`);
  };

  const markPaid = async (orderId: string) => {
    await updateOrder(orderId, { paymentStatus: 'paid' });
    toast.success(`Payment marked as paid for ${orderId}`);
  };

  const filteredOrders = searchId.trim()
    ? orders.filter(o => o.customerUniqueId?.toLowerCase().includes(searchId.toLowerCase()) || o.userId.toLowerCase().includes(searchId.toLowerCase()))
    : orders;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by Customer ID..." value={searchId} onChange={e => setSearchId(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="glass-card space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{order.id}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {order.customerUniqueId || order.userId}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                    {order.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">{order.date}</p>
                </div>
              </div>

              <div className="space-y-1 border-y py-2">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm">
                    {item.quantity}x {item.productName} — ₹{item.price}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span>{PAYMENT_METHOD_LABELS[order.paymentMethod || 'cash_on_grab']}</span>
                </div>
                <div className={`inline-flex w-fit items-center rounded-full px-2 py-1 ${order.paymentStatus === 'paid' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                  Payment: {order.paymentStatus === 'ledger' ? 'Ledger' : order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </div>
                {(order.pickupDate || order.pickupTime) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{order.pickupDate} {order.pickupTime}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BadgeIndianRupee className="h-3 w-3 text-primary" />
                  <span>Total: ₹{order.total}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-primary">Customer ID: {order.customerUniqueId || '—'}</p>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'Pending' && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateOrderStatus(order.id, 'Accepted')}>
                      <Check className="h-3 w-3" /> Accept Order
                    </Button>
                  )}
                  {(order.status === 'Accepted' || order.status === 'Ready for Pickup') && (
                    <Button size="sm" className="gap-1 text-xs" onClick={() => updateOrderStatus(order.id, 'Delivered')}>
                      <PackageCheck className="h-3 w-3" /> Confirm Delivered
                    </Button>
                  )}
                  {order.paymentMethod === 'cash_on_grab' && order.paymentStatus !== 'paid' && (
                    <Button size="sm" variant="secondary" className="text-xs" onClick={() => markPaid(order.id)}>
                      Mark Paid
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
