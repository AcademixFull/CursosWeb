import { env } from "../config/env";
import { courseMocks } from "../data/courseMocks";
import { createReviewMock, mergeCourseReviewMocks } from "../data/reviewMocks";
import type { AuthUser } from "../types/auth.types";
import type {
  CourseReview,
  CreateReviewInput,
  ReviewListResult,
} from "../types/course.types";
import { api } from "./api";

const MOCK_DELAY_MS = 180;

export async function listCourseReviews(
  courseId: string,
  page = 1,
  limit = 5,
): Promise<ReviewListResult> {
  if (env.dataSource === "api") {
    return api.getPage<CourseReview>(
      `/courses/${encodeURIComponent(courseId)}/reviews?page=${page}&limit=${limit}`,
    ).then((result) => ({
      items: result.items,
      pagination: {
        ...result.pagination,
        totalPages: result.pagination.totalPages
          ?? Math.max(1, Math.ceil(result.pagination.total / result.pagination.limit)),
      },
    }));
  }

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  const course = courseMocks.find((item) => item.id === courseId);
  if (!course) throw new Error("No encontramos el curso solicitado.");

  const reviews = mergeCourseReviewMocks(course).reviews;
  const start = (page - 1) * limit;
  return {
    items: reviews.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: reviews.length,
      totalPages: Math.max(1, Math.ceil(reviews.length / limit)),
    },
  };
}

export async function createCourseReview(
  courseId: string,
  user: AuthUser,
  input: CreateReviewInput,
): Promise<CourseReview> {
  if (env.dataSource === "api") {
    return api.post<CourseReview>(`/courses/${encodeURIComponent(courseId)}/reviews`, input);
  }

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  return createReviewMock(courseId, user, input);
}
