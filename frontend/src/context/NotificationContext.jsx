import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const NotificationContext = createContext(null);

const MAX_ITEMS = 50;

/**
 * In-app notification inbox (e.g. budget threshold alerts). Shown under the header bell.
 */
export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const addNotification = useCallback(({ id, title, message, variant = 'info' }) => {
    if (!id || !title) return;
    setItems((prev) => {
      if (prev.some((n) => n.id === id)) return prev;
      const row = {
        id,
        title,
        message: message || '',
        variant,
        createdAt: Date.now(),
        read: false,
      };
      return [row, ...prev].slice(0, MAX_ITEMS);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const value = useMemo(
    () => ({
      notifications: items,
      addNotification,
      markAllRead,
      markOneRead,
      clearAll,
      unreadCount,
    }),
    [items, addNotification, markAllRead, markOneRead, clearAll, unreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
