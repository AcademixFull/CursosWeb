import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { moderationService } from "../services/moderation.service";
import type { ModerationCourseListFilters } from "../types/moderation.types";

export const moderationQueryKeys = {
  root: ["moderation"] as const,
  courses: (filters: ModerationCourseListFilters) => ["moderation", "courses", filters] as const,
  course: (courseId: string) => ["moderation", "course", courseId] as const,
};

export function useModerationCourses(filters: ModerationCourseListFilters) {
  return useQuery({
    queryKey: moderationQueryKeys.courses(filters),
    queryFn: () => moderationService.listCourses(filters),
  });
}

export function useModerationCourse(courseId: string) {
  return useQuery({
    queryKey: moderationQueryKeys.course(courseId),
    queryFn: () => moderationService.getCourse(courseId),
    enabled: Boolean(courseId),
  });
}

export function useModerationActions(courseId: string) {
  const client = useQueryClient();
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: moderationQueryKeys.root }),
      client.invalidateQueries({ queryKey: moderationQueryKeys.course(courseId) }),
      client.invalidateQueries({ queryKey: ["management", "courses"] }),
      client.invalidateQueries({ queryKey: ["management", "instructor-courses"] }),
    ]);
  }

  return {
    takeDown: useMutation({
      mutationFn: (reason: string) => moderationService.takeDown(courseId, reason),
      onSuccess: refresh,
    }),
    restore: useMutation({
      mutationFn: () => moderationService.restore(courseId),
      onSuccess: refresh,
    }),
  };
}
