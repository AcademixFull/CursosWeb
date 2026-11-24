import type {
  AuthoringCourseContent,
  CourseWorkflowStatus,
  ManagedCourse,
  Paged,
} from "./management.types";

export type ModerationCourseStatus = "review" | "published" | "moderated";

export interface ModerationActor {
  id: string;
  name: string;
}

export interface CourseModerationRecord {
  id: string;
  courseId: string;
  moderator: ModerationActor;
  reason: string;
  previousStatus: CourseWorkflowStatus;
  active: boolean;
  moderatedAt: string;
  restoredBy: ModerationActor | null;
  restoredAt: string | null;
}

export interface ModerationCourseDetail {
  course: ManagedCourse;
  content: AuthoringCourseContent;
  moderationHistory: CourseModerationRecord[];
}

export interface ModerationCourseListFilters {
  search?: string;
  status?: ModerationCourseStatus;
  page?: number;
  limit?: number;
}

export type ModerationCoursePage = Paged<ManagedCourse>;

export interface ModerationActionResult {
  course: ManagedCourse;
  moderation: CourseModerationRecord;
}
