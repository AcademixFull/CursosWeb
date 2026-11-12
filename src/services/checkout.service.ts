import { api } from "./api";
import type { EnrollmentSummary } from "../types/student.types";

export interface CheckoutInput { courseIds: string[]; idempotencyKey: string }
export interface CheckoutResult {
  id: string;
  mode: "simulated";
  currency: "MXN";
  total: number;
  items: Array<{ courseId: string; enrollmentId: string; amount: number; alreadyOwned: boolean }>;
  enrollments: EnrollmentSummary[];
}

export async function simulatedCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const result = await api.post<CheckoutResult>("/checkout/simulated", input);
  // The PWA refreshes the user's library and downloads newly granted material.
  window.dispatchEvent(new Event("academix:enrolled"));
  return result;
}
