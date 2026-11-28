import type { UserRole } from "./auth.types";
import type { CourseLevel } from "./course.types";

export type CourseWorkflowStatus = "draft" | "review" | "published" | "archived" | "moderated";
export type CourseModality = "self_paced" | "live" | "blended";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: UserRole[];
  institutionalOrganizations?: Array<{ id: string; name: string }>;
}

export interface ManagedInstructor {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  experienceYears: number;
  active: boolean;
}

export interface ManagedCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

export type InstructorApplicationStatus = "pending" | "approved" | "rejected";

export interface InstructorApplication {
  id: string;
  folio: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  enrollmentId: string;
  credentialReference: string;
  status: InstructorApplicationStatus;
  observations: string;
  requestedAt: string;
  reviewedAt: string | null;
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
  featuredVisible?: boolean;
  organization: { id: string; name: string } | null;
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

export type CourseMediaKind = "cover" | "intro";

export interface AuthoringCourseMedia {
  coverUrl?: string;
  introVideoUrl?: string;
}

export interface AuthoringCourseContent {
  courseId: string;
  status: CourseWorkflowStatus;
  modules: AuthoringModule[];
  media?: AuthoringCourseMedia;
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
  featuredVisible?: boolean;
  organizationId?: string | null;
}

export interface BasicListFilters { page?: number; limit?: number; search?: string; active?: "true" | "false" }
export interface UserListFilters extends BasicListFilters { role?: UserRole | "institutional_administrator"; sort?: "name" | "email" | "createdAt"; direction?: "asc" | "desc" }
export interface ManagedCourseFilters { page?: number; limit?: number; search?: string; status?: CourseWorkflowStatus; scope?: "external" | "institutional"; organizationId?: string }
export interface ApplicationListFilters { page?: number; limit?: number; status?: InstructorApplicationStatus }
export interface ReviewListFilters { page?: number; limit?: number; visibility?: "all" | "visible" | "hidden"; courseId?: string }
export interface AdminFilters { users?: UserListFilters; courses?: ManagedCourseFilters; instructors?: BasicListFilters; categories?: BasicListFilters; applications?: ApplicationListFilters; reviews?: ReviewListFilters }
