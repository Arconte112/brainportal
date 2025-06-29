'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        toast({
          title: 'Sin conexión',
          description: 'Trabajando en modo offline. Los cambios se sincronizarán cuando se restablezca la conexión.',
          variant: 'destructive',
        });
      } else if (!isOnline && online) {
        toast({
          title: 'Conexión restablecida',
          description: 'Sincronizando cambios...',
        });
      }
    };

    // Check initial status
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline, toast]);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Sin conexión</span>
    </div>
  );
}