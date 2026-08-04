export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

export interface InstructorSummary {
  id: string;
  name: string;
  specialty: string;
  avatarUrl?: string;
}

export interface InstructorDetail extends InstructorSummary {
  biography: string;
  experienceYears: number;
  studentCount: number;
  courseCount: number;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: CourseCategory;
  instructor: InstructorSummary;
  level: CourseLevel;
  durationHours: number;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl?: string;
  certificateEnabled: boolean;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  isPreview: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  position: number;
  lessons: CourseLesson[];
}

export interface CourseReview {
  id: string;
  authorId?: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  learningOutcomes: string[];
  requirements: string[];
  language: string;
  modules: CourseModule[];
  reviews: CourseReview[];
  relatedCourseIds: string[];
}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: CourseLevel | "all";
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseListResult {
  items: CourseSummary[];
  pagination: Pagination;
}
