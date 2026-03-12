import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

export default function StoreLayout() {
  const { storeId } = useParams<{ storeId: string }>();
  const { setStoreId } = useStore();

  useEffect(() => {
    if (storeId) {
      setStoreId(storeId);
    }
  }, [storeId, setStoreId]);

  return <Outlet />;
}
