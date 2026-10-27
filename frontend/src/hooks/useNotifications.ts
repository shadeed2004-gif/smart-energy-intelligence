import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<Notification[]>('/notifications?limit=50');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    fetchNotifications();
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
