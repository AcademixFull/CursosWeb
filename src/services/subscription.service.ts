import { withCatalogSnapshot } from "../offline/catalog";
import { api, ApiError } from "./api";
import planReference from "../assets/plan-reference.json";
import type { PlanReceipt, SubscriptionPlan, SubscriptionSummary } from "../types/subscription.types";
const defaultPlans = planReference as SubscriptionPlan[];
const fetchPlans = () => api.get<SubscriptionPlan[]>("/plans");

export const subscriptionService = {
  async plans() {
    try { return await withCatalogSnapshot("plans", fetchPlans); }
    catch (error) {
      if (error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.status >= 500)) {
        return defaultPlans;
      }
      throw error;
    }
  },
  fetchPlans,
  list: (page = 1) => api.getPage<SubscriptionSummary>(`/subscriptions?page=${page}&limit=20`),
  transactions: (page = 1) => api.getPage<PlanReceipt & { createdAt: string }>(`/subscriptions/transactions?page=${page}&limit=10`),
  purchase: (input: { planId: string; organizationId?: string; idempotencyKey: string }) => api.post<PlanReceipt>("/subscriptions/simulated-purchase", input),
};
