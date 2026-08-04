import { env } from "../config/env";
import { createReviewMock } from "../data/reviewMocks";
import type { AuthUser } from "../types/auth.types";
import type { CourseReview, CreateReviewInput } from "../types/course.types";
import { api } from "./api";

const MOCK_DELAY_MS = 180;

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
