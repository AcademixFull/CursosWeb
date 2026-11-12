import { useAuth } from "./useAuth";
import { privateScope } from "../utils/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";

export function useNotifications() {
  const client = useQueryClient();
  const { user } = useAuth();
  const identity = privateScope(user ?? undefined);
  const keys = { list: ["notifications", ...identity], count: ["notifications", ...identity, "unread"] };
  const invalidate = () => Promise.all([client.invalidateQueries({ queryKey: keys.list }), client.invalidateQueries({ queryKey: keys.count })]);
  return {
    list: useQuery({ queryKey: keys.list, queryFn: notificationService.list, enabled: Boolean(user), staleTime: 15_000 }),
    count: useQuery({ queryKey: keys.count, queryFn: notificationService.unreadCount, enabled: Boolean(user), staleTime: 15_000, refetchInterval: 30_000 }),
    markRead: useMutation({ mutationFn: notificationService.markRead, onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: notificationService.markAllRead, onSuccess: invalidate }),
  };
}
