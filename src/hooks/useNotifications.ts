import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";
const keys = { list: ["notifications"] as const, count: ["notifications", "unread"] as const };
export function useNotifications() {
  const client = useQueryClient();
  const invalidate = () => Promise.all([client.invalidateQueries({ queryKey: keys.list }), client.invalidateQueries({ queryKey: keys.count })]);
  return {
    list: useQuery({ queryKey: keys.list, queryFn: notificationService.list, staleTime: 15_000 }),
    count: useQuery({ queryKey: keys.count, queryFn: notificationService.unreadCount, staleTime: 15_000, refetchInterval: 30_000 }),
    markRead: useMutation({ mutationFn: notificationService.markRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: notificationService.markAllRead, onSuccess: invalidate }),
  };
}
