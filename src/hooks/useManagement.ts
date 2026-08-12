import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { managementService } from "../services/management.service";
import type { CourseInput, CourseWorkflowStatus } from "../types/management.types";
import type { UserRole } from "../types/auth.types";

export const managementQueryKeys = {
  users: ["management", "users"] as const,
  instructors: ["management", "instructors"] as const,
  courses: ["management", "courses"] as const,
  reviews: ["management", "reviews"] as const,
  options: ["management", "options"] as const,
  instructorCourses: ["management", "instructor-courses"] as const,
  content: (courseId: string) => ["management", "content", courseId] as const,
  resources: ["management", "resource-options"] as const,
};

export function useAdminData() {
  return {
    users: useQuery({ queryKey: managementQueryKeys.users, queryFn: () => managementService.listUsers({ limit: 50 }) }),
    instructors: useQuery({ queryKey: managementQueryKeys.instructors, queryFn: managementService.listInstructors }),
    courses: useQuery({ queryKey: managementQueryKeys.courses, queryFn: () => managementService.listAdminCourses({ limit: 50 }) }),
    reviews: useQuery({ queryKey: managementQueryKeys.reviews, queryFn: () => managementService.listReviews({ limit: 50 }) }),
    options: useQuery({ queryKey: managementQueryKeys.options, queryFn: managementService.courseOptions }),
  };
}

export function useAdminActions() {
  const client = useQueryClient();
  const invalidate = (...keys: ReadonlyArray<readonly unknown[]>) => Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
  return {
    setRoles: useMutation({
      mutationFn: ({ userId, roles }: { userId: string; roles: UserRole[] }) => managementService.setUserRoles(userId, roles),
      onSuccess: () => invalidate(managementQueryKeys.users, managementQueryKeys.instructors),
    }),
    upsertInstructor: useMutation({
      mutationFn: ({ userId, specialty, experienceYears }: { userId: string; specialty: string; experienceYears: number }) =>
        managementService.upsertInstructor(userId, { specialty, experienceYears }),
      onSuccess: () => invalidate(managementQueryKeys.instructors),
    }),
    createCategory: useMutation({
      mutationFn: managementService.createCategory,
      onSuccess: () => invalidate(managementQueryKeys.options),
    }),
    updateCategory: useMutation({
      mutationFn: ({ categoryId, active }: { categoryId: number; active: boolean }) => managementService.updateCategory(categoryId, { active }),
      onSuccess: () => invalidate(managementQueryKeys.options),
    }),
    createCourse: useMutation({
      mutationFn: (input: CourseInput) => managementService.createCourse(input),
      onSuccess: () => invalidate(managementQueryKeys.courses),
    }),
    assignInstructor: useMutation({
      mutationFn: ({ courseId, instructorId }: { courseId: string; instructorId: string }) => managementService.assignInstructor(courseId, instructorId),
      onSuccess: () => invalidate(managementQueryKeys.courses),
    }),
    publish: useMutation({ mutationFn: managementService.publishCourse, onSuccess: () => invalidate(managementQueryKeys.courses) }),
    archive: useMutation({ mutationFn: managementService.archiveCourse, onSuccess: () => invalidate(managementQueryKeys.courses) }),
    moderate: useMutation({
      mutationFn: ({ reviewId, visible, reason }: { reviewId: string; visible: boolean; reason?: string }) => managementService.moderateReview(reviewId, { visible, reason }),
      onSuccess: () => invalidate(managementQueryKeys.reviews),
    }),
  };
}

export function useInstructorCourses(status?: CourseWorkflowStatus) {
  return useQuery({
    queryKey: [...managementQueryKeys.instructorCourses, status ?? "all"],
    queryFn: () => managementService.listInstructorCourses({ status, limit: 50 }),
  });
}

export function useCourseContent(courseId: string) {
  return useQuery({
    queryKey: managementQueryKeys.content(courseId),
    queryFn: () => managementService.getCourseContent(courseId),
    enabled: Boolean(courseId),
  });
}

export function useResourceOptions() {
  return useQuery({ queryKey: managementQueryKeys.resources, queryFn: managementService.resourceOptions });
}

export function useInvalidateCourseContent(courseId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: managementQueryKeys.content(courseId) });
}
