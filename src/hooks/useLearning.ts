import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLearningCourse, setLearningLessonProgress } from "../services/learning.service";
import type { EnrollmentSummary } from "../types/student.types";
import { useAuth } from "./useAuth";
import { studentQueryKeys } from "./useStudent";

const learningQueryKey = (courseId: string, userId: string) =>
  ["learning", userId, courseId] as const;

export function useLearningCourse(courseId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: learningQueryKey(courseId, user?.id ?? "anonymous"),
    queryFn: () => getLearningCourse(courseId),
    networkMode: "always",
    enabled: Boolean(courseId && user),
  });
}

export function useSetLessonProgress(courseId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "anonymous";

  return useMutation({
    networkMode: "always",
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      setLearningLessonProgress(courseId, lessonId, completed),
    onSuccess: (learningCourse) => {
      queryClient.setQueryData(learningQueryKey(courseId, userId), learningCourse);
      queryClient.setQueryData<EnrollmentSummary[]>(studentQueryKeys.courses(userId), (enrollments) =>
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
      if (learningCourse.progressPercentage === 100) {
        void queryClient.invalidateQueries({ queryKey: studentQueryKeys.certificates(userId) });
      }
    },
  });
}
