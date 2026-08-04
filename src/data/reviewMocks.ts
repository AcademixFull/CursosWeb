import type { AuthUser } from "../types/auth.types";
import type { CourseDetail, CourseReview, CreateReviewInput } from "../types/course.types";

const REVIEWS_KEY = "academix.mock-reviews.v1";

interface StoredReview extends CourseReview {
  courseId: string;
  authorId: string;
}

function isStoredReview(value: unknown): value is StoredReview {
  if (!value || typeof value !== "object") return false;
  const review = value as Partial<StoredReview>;
  return Boolean(
    review.id &&
      review.courseId &&
      review.authorId &&
      review.authorName &&
      review.comment &&
      typeof review.rating === "number",
  );
}

function readReviews(): StoredReview[] {
  try {
    const storedValue = sessionStorage.getItem(REVIEWS_KEY);
    const reviews: unknown = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(reviews) ? reviews.filter(isStoredReview) : [];
  } catch {
    return [];
  }
}

export function getCourseReviewMocks(courseId: string): CourseReview[] {
  return readReviews().filter((review) => review.courseId === courseId);
}

export function mergeCourseReviewMocks(course: CourseDetail): CourseDetail {
  const addedReviews = getCourseReviewMocks(course.id);
  if (!addedReviews.length) return course;

  const addedRatingTotal = addedReviews.reduce((total, review) => total + review.rating, 0);
  const reviewCount = course.reviewCount + addedReviews.length;
  const rating = Number(
    ((course.rating * course.reviewCount + addedRatingTotal) / reviewCount).toFixed(1),
  );

  return {
    ...course,
    rating,
    reviewCount,
    reviews: [...addedReviews, ...course.reviews],
  };
}

export function createReviewMock(
  courseId: string,
  user: AuthUser,
  input: CreateReviewInput,
): CourseReview {
  const storedReviews = readReviews();
  const duplicate = storedReviews.some(
    (review) => review.courseId === courseId && review.authorId === user.id,
  );
  if (duplicate) throw new Error("Ya publicaste una reseña para este curso.");

  const review: StoredReview = {
    id: `review-${courseId}-${user.id}`,
    courseId,
    authorId: user.id,
    authorName: user.fullName,
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(REVIEWS_KEY, JSON.stringify([review, ...storedReviews]));
  return review;
}
