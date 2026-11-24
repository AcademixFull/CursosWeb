import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollInCourse } from "../services/enrollments.service";
import { ApiError } from "../services/api";
import type { EnrollmentSummary } from "../types/student.types";
import { useAuth } from "./useAuth";
import { studentQueryKeys } from "./useStudent";

export function useEnrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coursesKey = studentQueryKeys.courses(user?.id ?? "anonymous");

  return useMutation({
    mutationFn: (courseId: string) => {
      if (!user) throw new Error("Debes iniciar sesión para inscribirte.");
      return enrollInCourse(courseId);
    },
    onSuccess: (enrollment) => {
      queryClient.setQueryData<EnrollmentSummary[]>(coursesKey, (current) => {
        if (!current) return [enrollment];
        const alreadyIncluded = current.some((item) => item.course.id === enrollment.course.id);
        return alreadyIncluded ? current : [...current, enrollment];
      });
      void queryClient.invalidateQueries({ queryKey: coursesKey });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "ENROLLMENT_ALREADY_EXISTS") {
        void queryClient.invalidateQueries({ queryKey: coursesKey });
      }
    },
  });
}
