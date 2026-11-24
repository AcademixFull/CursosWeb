import type {
  ModerationActionResult,
  ModerationCourseDetail,
  ModerationCourseListFilters,
  ModerationCoursePage,
} from "../types/moderation.types";
import type { ManagedCourse } from "../types/management.types";
import { api } from "./api";

function query(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const moderationService = {
  async listCourses(filters: ModerationCourseListFilters = {}): Promise<ModerationCoursePage> {
    return api.getPage<ManagedCourse>(`/moderation/courses${query({ search: filters.search, status: filters.status, page: filters.page, limit: filters.limit })}`);
  },

  getCourse(courseId: string): Promise<ModerationCourseDetail> {
    return api.get<ModerationCourseDetail>(`/moderation/courses/${encodeURIComponent(courseId)}`);
  },

  takeDown(courseId: string, reason: string): Promise<ModerationActionResult> {
    return api.post<ModerationActionResult>(
      `/moderation/courses/${encodeURIComponent(courseId)}/takedown`,
      { reason },
    );
  },

  restore(courseId: string): Promise<ModerationActionResult> {
    return api.post<ModerationActionResult>(
      `/moderation/courses/${encodeURIComponent(courseId)}/restore`,
    );
  },
};
