import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  type: string;
  message: string;
  productName?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("product_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calculate unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
    // Save to localStorage
    localStorage.setItem("product_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Subscribe to new products (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('global-new-products-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          const newProduct = payload.new as { name: string; id: string };
          const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'new_product',
            message: `New product added: ${newProduct.name}`,
            productName: newProduct.name,
            timestamp: new Date(),
            read: false,
          };
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
          toast({
            title: "🎉 New Product Added!",
            description: newProduct.name,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, toast]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
