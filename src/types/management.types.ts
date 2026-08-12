import type { UserRole } from "./auth.types";
import type { CourseLevel } from "./course.types";

export type CourseWorkflowStatus = "draft" | "review" | "published" | "archived";
export type CourseModality = "self_paced" | "live" | "blended";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: UserRole[];
}

export interface ManagedInstructor {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  experienceYears: number;
  active: boolean;
}

export interface ManagedCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string;
  categoryId: number;
  level: CourseLevel;
  modality: CourseModality;
  language: string;
  durationHours: number | null;
  price: number;
  certificateEnabled: boolean;
  requiresApproval: boolean;
  status: CourseWorkflowStatus;
  active: boolean;
  instructor: { id: string; name: string } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseOptions {
  categories: Array<{ id: number; name: string; slug: string }>;
  levels: Array<{ value: CourseLevel; label: string }>;
  modalities: Array<{ value: CourseModality; label: string }>;
  languages: Array<{ code: string; name: string }>;
  statuses: Array<{ value: CourseWorkflowStatus; label: string }>;
}

export interface AdminReview {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  visible: boolean;
  moderationReason: string | null;
  courseId: string;
  courseTitle: string;
}

export interface AuthoringResource {
  id: string;
  typeId: number;
  type: string;
  title: string;
  description: string;
  url: string | null;
  fileId: string | null;
  required: boolean;
  position: number;
  active: boolean;
}

export interface AuthoringLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  durationMinutes: number;
  position: number;
  isPreview: boolean;
  active: boolean;
  resources: AuthoringResource[];
}

export interface AuthoringModule {
  id: string;
  title: string;
  description: string;
  position: number;
  active: boolean;
  lessons: AuthoringLesson[];
}

export interface AuthoringCourseContent {
  courseId: string;
  status: CourseWorkflowStatus;
  modules: AuthoringModule[];
}

export interface UploadedCourseFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages?: number };
}

export interface CourseInput {
  title: string;
  shortDescription: string;
  description: string;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string;
  categoryId: number;
  level: CourseLevel;
  modality: CourseModality;
  language: string;
  durationHours: number | null;
  price: number;
  certificateEnabled: boolean;
  requiresApproval: boolean;
}
