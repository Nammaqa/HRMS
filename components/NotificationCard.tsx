"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "GENERAL" | "ALERT" | "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  icon: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCardProps {
  userId: string;
}

interface NotificationCardProps {
  userId: string;
  onUnreadChange?: (count: number) => void;
}

export function NotificationCard({ userId, onUnreadChange }: NotificationCardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const slice = data.slice(0, 50);
        setNotifications(slice);
        const unreadCount = slice.filter((n: Notification) => !n.isRead).length;
        if (onUnreadChange) onUnreadChange(unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // notify parent
      const newCount = notifications.filter((n) => n.id !== id && !n.isRead).length;
      if (onUnreadChange) onUnreadChange(newCount);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const next = notifications.filter((n) => n.id !== id);
      setNotifications(next);
      const unread = next.filter((n) => !n.isRead).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <div className="divide-y divide-gray-200 overflow-y-auto h-[calc(100vh-64px)]">
      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No notifications</p>
        </div>
        ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => !notif.isRead && markAsRead(notif.id)}
            className={`flex items-start gap-3 p-4 cursor-pointer transition ${
              notif.isRead ? "bg-white" : "bg-indigo-50"
            } hover:bg-gray-50`}
          >
            <span className="text-xl flex-shrink-0">{notif.icon}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-medium text-gray-900 truncate">
                  {notif.title}
                  {!notif.isRead && (
                    <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full inline-block" />
                  )}
                </h4>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                  aria-label={`Delete notification ${notif.title}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                {notif.message}
              </p>

              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(notif.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
