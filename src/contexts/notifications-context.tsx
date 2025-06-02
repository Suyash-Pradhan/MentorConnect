
"use client";

import type { AppNotification } from "@/types";
import * as React from "react";
import { v4 as uuidv4 } from 'uuid';

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

export const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = (): NotificationsContextType => {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};

interface NotificationsProviderProps {
  children: React.ReactNode;
}

const MAX_NOTIFICATIONS = 20; // Max notifications to keep in state

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const addNotification = React.useCallback((notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    // Prevent duplicate notifications for the same chat message if logic elsewhere sends multiple times
    // This check is basic, relies on chatId and text. Might need refinement.
    if (notificationData.type === 'new_message' && notificationData.chatId) {
        const existing = notifications.find(n => n.chatId === notificationData.chatId && n.text.startsWith(notificationData.text.substring(0,30)) );
        if (existing) {
            // console.log("Duplicate notification attempt prevented for chat:", notificationData.chatId);
            return; // Don't add if very similar notification for same chat exists
        }
    }


    const newNotification: AppNotification = {
      ...notificationData,
      id: uuidv4(),
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, MAX_NOTIFICATIONS - 1)]);
    setUnreadCount(prev => prev + 1);
  }, [notifications]);

  const markNotificationAsRead = React.useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId && !n.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
          return { ...n, isRead: true };
        }
        return n;
      })
    );
  }, []);

  const markAllNotificationsAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
