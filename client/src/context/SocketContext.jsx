import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const { addIncoming } = useNotifications();
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      setSocket(null);
      return undefined;
    }

    const instance = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.on('notification:new', (notification) => {
      addIncoming(notification);
      toast.info(notification.title, {
        description: notification.message,
        duration: 7000,
      });
    });

    setSocket(instance);
    return () => {
      instance.disconnect();
      setConnected(false);
      setSocket(null);
    };
  }, [user, addIncoming, toast]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
}
