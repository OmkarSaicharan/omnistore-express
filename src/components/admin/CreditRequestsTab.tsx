import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, CreditCard } from 'lucide-react';

interface CreditRequest {
  id: string;
  store_id: string;
  customer_user_id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
}

export function CreditRequestsTab() {
  const { storeId } = useStore();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!storeId) return;
    setLoading(true);
    const { data } = await supabase.from('credit_requests').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    if (data) setRequests(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [storeId]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('credit_requests').update({ status, reviewed_at: new Date().toISOString() } as any).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Credit request ${status}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">Credit Ledger Requests</h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No credit requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{req.customer_name}</p>
                <p className="text-xs text-muted-foreground">{req.customer_email}</p>
                <p className="text-xs text-muted-foreground">ID: {req.customer_user_id}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  req.status === 'approved' ? 'bg-green-100 text-green-800' :
                  req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{req.status}</span>
              </div>
              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAction(req.id, 'approved')}>
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAction(req.id, 'rejected')}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
