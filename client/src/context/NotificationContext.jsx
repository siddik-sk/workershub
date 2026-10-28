import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../services';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return 0;
    }
    try {
      const response = await notificationApi.unreadCount();
      setUnread(response.data.unread);
      return response.data.unread;
    } catch {
      return 0;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshUnread();
    } else {
      setUnread(0);
      setNotifications([]);
      setFetched(false);
    }
  }, [user, refreshUnread]);

  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!user) return null;
      setLoading(true);
      try {
        const response = await notificationApi.list({ limit: 30, ...params });
        setNotifications(response.data.notifications);
        setUnread(response.data.unread);
        setFetched(true);
        return response.data;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const markRead = useCallback(async (id) => {
    const response = await notificationApi.markRead(id);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification
      )
    );
    setUnread(response.data.unread);
    return response.data;
  }, []);

  const markAllRead = useCallback(async () => {
    const response = await notificationApi.markAllRead();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnread(0);
    return response.data;
  }, []);

  const addIncoming = useCallback((notification) => {
    setUnread((current) => current + 1);
    setNotifications((current) => {
      if (!current.length) return current;
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current];
    });
  }, []);

  const value = useMemo(
    () => ({
      unread,
      notifications,
      loading,
      fetched,
      refreshUnread,
      fetchNotifications,
      markRead,
      markAllRead,
      addIncoming,
      setUnread,
    }),
    [unread, notifications, loading, fetched, refreshUnread, fetchNotifications, markRead, markAllRead, addIncoming]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
