import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollInCourse } from "../services/enrollments.service";
import type { EnrollmentSummary } from "../types/student.types";
import { studentQueryKeys } from "./useStudent";

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollInCourse,
    onSuccess: (enrollment) => {
      queryClient.setQueryData<EnrollmentSummary[]>(studentQueryKeys.courses, (current) => {
        if (!current) return current;
        const alreadyIncluded = current.some((item) => item.course.id === enrollment.course.id);
        return alreadyIncluded ? current : [...current, enrollment];
      });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.courses });
    },
  });
}
