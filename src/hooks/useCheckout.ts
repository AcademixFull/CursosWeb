import { useMutation, useQueryClient } from "@tanstack/react-query";
import { simulatedCheckout, type CheckoutInput } from "../services/checkout.service";
import type { EnrollmentSummary } from "../types/student.types";
import { useAuth } from "./useAuth";
import { studentQueryKeys } from "./useStudent";

export function useSimulatedCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckoutInput) => {
      if (!user) throw new Error("Inicia sesión para confirmar tu compra.");
      const userId = user.id;
      return { receipt: await simulatedCheckout(input), userId };
    },
    onSuccess: ({ receipt, userId }) => {
      const queryKey = studentQueryKeys.courses(userId);
      queryClient.setQueryData<EnrollmentSummary[]>(queryKey, (current = []) => {
        const owned = new Map(current.map((item) => [item.course.id, item]));
        for (const enrollment of receipt.enrollments) owned.set(enrollment.course.id, enrollment);
        return [...owned.values()];
      });
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["student", userId, "ownership"] });
    },
  });
}
