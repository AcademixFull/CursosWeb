import { api } from "./api";
import type { UserNotification } from "../types/notification.types";
export const notificationService = {
  list: () => api.get<UserNotification[]>("/notifications?limit=30"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.patch<UserNotification>(`/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllRead: () => api.patch<{ updated: boolean }>("/notifications/read-all", {}),
};
