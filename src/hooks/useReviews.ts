import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { createCourseReview, listCourseReviews } from "../services/reviews.service";
import type { CreateReviewInput } from "../types/course.types";

interface CreateReviewVariables {
  courseId: string;
  input: CreateReviewInput;
}

export function useCourseReviews(courseId: string | undefined, page: number, limit = 5) {
  return useQuery({
    queryKey: ["course-reviews", courseId, page, limit],
    queryFn: () => listCourseReviews(courseId ?? "", page, limit),
    enabled: Boolean(courseId),
  });
}

export function useCreateReview(courseQueryId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: CreateReviewVariables) => {
      if (!user) throw new Error("Debes iniciar sesión para publicar una reseña.");
      return createCourseReview(courseId, user, input);
    },
    onSuccess: (_review, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["course", courseQueryId] });
      void queryClient.invalidateQueries({ queryKey: ["course-reviews", variables.courseId] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
