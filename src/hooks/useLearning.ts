import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeLearningLesson, getLearningCourse } from "../services/learning.service";
import type { EnrollmentSummary } from "../types/student.types";
import { studentQueryKeys } from "./useStudent";

const learningQueryKey = (courseId: string) => ["learning", courseId] as const;

export function useLearningCourse(courseId: string) {
  return useQuery({
    queryKey: learningQueryKey(courseId),
    queryFn: () => getLearningCourse(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCompleteLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => completeLearningLesson(courseId, lessonId),
    onSuccess: (learningCourse) => {
      queryClient.setQueryData(learningQueryKey(courseId), learningCourse);
      queryClient.setQueryData<EnrollmentSummary[]>(studentQueryKeys.courses, (enrollments) =>
        enrollments?.map((enrollment) =>
          enrollment.course.id === learningCourse.id
            ? {
                ...enrollment,
                progressPercentage: learningCourse.progressPercentage,
                completedLessons: learningCourse.completedLessons,
                totalLessons: learningCourse.totalLessons,
                status: learningCourse.progressPercentage === 100 ? "completed" : "in_progress",
              }
            : enrollment,
        ),
      );
    },
  });
}
