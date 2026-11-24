import { api } from "./api";
import type { PlanReceipt, SubscriptionPlan, SubscriptionSummary } from "../types/subscription.types";
export const subscriptionService = {
  plans: () => api.get<SubscriptionPlan[]>("/plans"),
  list: (page = 1) => api.getPage<SubscriptionSummary>(`/subscriptions?page=${page}&limit=20`),
  transactions: (page = 1) => api.getPage<PlanReceipt & { createdAt: string }>(`/subscriptions/transactions?page=${page}&limit=10`),
  purchase: (input: { planId: string; organizationId?: string; idempotencyKey: string }) => api.post<PlanReceipt>("/subscriptions/simulated-purchase", input),
};
