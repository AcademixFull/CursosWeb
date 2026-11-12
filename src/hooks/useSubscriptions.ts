import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { subscriptionService } from "../services/subscription.service";
export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: subscriptionService.plans, staleTime: 60_000 });
}
export function useSubscriptions(page = 1) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["subscriptions", user?.id ?? "anonymous", page], queryFn: () => subscriptionService.list(page), enabled: Boolean(user), staleTime: 0, refetchInterval: 60_000 });
}
export function usePurchasePlan() {
  const client = useQueryClient();
  return useMutation({ mutationFn: subscriptionService.purchase, onSuccess: async () => {
    await Promise.all(["subscriptions", "organizations", "student", "learning"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  } });
}
export function useSubscriptionTransactions(page = 1) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["subscriptions", user?.id ?? "anonymous", "transactions", page], queryFn: () => subscriptionService.transactions(page), enabled: Boolean(user) });
}
