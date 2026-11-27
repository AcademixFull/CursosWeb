import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { subscriptionService } from "../services/subscription.service";
import { getAuthToken } from "../utils/authSessionStore";
import { ApiError } from "../services/api";
import type { SubscriptionPlan } from "../types/subscription.types";
export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: subscriptionService.plans, networkMode: "always", staleTime: 60_000 });
}
export function useSubscriptions(page = 1) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["subscriptions", user?.id ?? "anonymous", page], queryFn: () => subscriptionService.list(page), enabled: Boolean(user), staleTime: 0, refetchInterval: 60_000 });
}
export function usePurchasePlan() {
  const client = useQueryClient();
  return useMutation({ networkMode: "always", mutationFn: async ({ plan, organizationId, idempotencyKey }: {
    plan: SubscriptionPlan; organizationId?: string; idempotencyKey: string;
  }) => {
    if (!navigator.onLine) throw new Error("Conéctate a internet para confirmar la suscripción.");
    const token = getAuthToken();
    const plans = await subscriptionService.fetchPlans();
    if (!token || getAuthToken() !== token) throw new Error("Inicia sesión para confirmar la suscripción.");
    const current = plans.find((item) => item.id === plan.id);
    client.setQueryData(["plans"], plans);
    if (!current?.purchasable || current.priceMxn !== plan.priceMxn || current.months !== plan.months) {
      throw new ApiError("El plan cambió. Revisa el precio y confirma de nuevo.", { code: "PLAN_CHANGED", status: 409 });
    }
    return subscriptionService.purchase({ planId: plan.id, organizationId, idempotencyKey });
  }, onSuccess: async () => {
    await Promise.all(["subscriptions", "organizations", "student", "learning"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  } });
}
export function useSubscriptionTransactions(page = 1) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["subscriptions", user?.id ?? "anonymous", "transactions", page], queryFn: () => subscriptionService.transactions(page), enabled: Boolean(user) });
}
