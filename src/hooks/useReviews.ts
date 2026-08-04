import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { createCourseReview } from "../services/reviews.service";
import type { CourseDetail, CreateReviewInput } from "../types/course.types";

interface CreateReviewVariables {
  courseId: string;
  input: CreateReviewInput;
}

export function useCreateReview(courseQueryId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: CreateReviewVariables) => {
      if (!user) throw new Error("Debes iniciar sesión para publicar una reseña.");
      return createCourseReview(courseId, user, input);
    },
    onSuccess: (review) => {
      queryClient.setQueryData<CourseDetail>(["course", courseQueryId], (course) => {
        if (!course) return course;
        const reviewCount = course.reviewCount + 1;
        const rating = Number(
          ((course.rating * course.reviewCount + review.rating) / reviewCount).toFixed(1),
        );
        return { ...course, rating, reviewCount, reviews: [review, ...course.reviews] };
      });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
