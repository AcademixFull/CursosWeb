import { useAuth } from "./useAuth";
import { privateScope } from "../utils/queryClient";
import { invalidateCatalog } from "../utils/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { managementService } from "../services/management.service";
import type { CourseInput, ManagedCourseFilters, AdminFilters } from "../types/management.types";
import type { UserRole } from "../types/auth.types";

export const managementQueryKeys = {
  users: ["management", "users"] as const,
  instructors: ["management", "instructors"] as const,
  courses: ["management", "courses"] as const,
  reviews: ["management", "reviews"] as const,
  options: ["management", "options"] as const,
  categories: ["management", "categories"] as const,
  applications: ["management", "instructor-applications"] as const,
  instructorCourses: ["management", "instructor-courses"] as const,
  content: (courseId: string) => ["management", "content", courseId] as const,
  resources: ["management", "resource-options"] as const,
};

export function useAdminData(filters: AdminFilters = {}, active: "users" | "courses" | "reviews" | "categories" | "applications" = "users") {
  const { user } = useAuth();
  const scope = privateScope(user ?? undefined);
  return {
    users: useQuery({ queryKey: [...managementQueryKeys.users, filters.users, ...scope], queryFn: () => managementService.listUsers(filters.users), enabled: active === "users" }),
    instructors: useQuery({ queryKey: [...managementQueryKeys.instructors, filters.instructors, ...scope], queryFn: () => managementService.listInstructors(filters.instructors), enabled: active === "courses" }),
    courses: useQuery({ queryKey: [...managementQueryKeys.courses, filters.courses, ...scope], queryFn: () => managementService.listAdminCourses(filters.courses), enabled: active === "courses" }),
    reviews: useQuery({ queryKey: [...managementQueryKeys.reviews, filters.reviews, ...scope], queryFn: () => managementService.listReviews(filters.reviews), enabled: active === "reviews" }),
    options: useQuery({ queryKey: [...managementQueryKeys.options, ...scope], queryFn: managementService.courseOptions, enabled: active === "courses" }),
    categories: useQuery({ queryKey: [...managementQueryKeys.categories, filters.categories, ...scope], queryFn: () => managementService.listCategories(filters.categories), enabled: active === "categories" }),
    applications: useQuery({ queryKey: [...managementQueryKeys.applications, filters.applications, ...scope], queryFn: () => managementService.listInstructorApplications(filters.applications), enabled: active === "applications" }),
  };
}

export function useAdminActions() {
  const client = useQueryClient();
  const invalidate = (...keys: ReadonlyArray<readonly unknown[]>) => Promise.all([...keys.map((queryKey) => client.invalidateQueries({ queryKey })), invalidateCatalog(client)]);
  return {
    setRoles: useMutation({
      mutationFn: ({ userId, roles }: { userId: string; roles: UserRole[] }) => managementService.setUserRoles(userId, roles),
      onSuccess: () => invalidate(managementQueryKeys.users, managementQueryKeys.instructors),
    }),
    setUserStatus: useMutation({
      mutationFn: ({ userId, active }: { userId: string; active: boolean }) => managementService.setUserStatus(userId, active),
      onSuccess: () => invalidate(managementQueryKeys.users, managementQueryKeys.instructors),
    }),
    upsertInstructor: useMutation({
      mutationFn: ({ userId, specialty, experienceYears }: { userId: string; specialty: string; experienceYears: number }) =>
        managementService.upsertInstructor(userId, { specialty, experienceYears }),
      onSuccess: () => invalidate(managementQueryKeys.instructors),
    }),
    createCategory: useMutation({
      mutationFn: managementService.createCategory,
      onSuccess: () => invalidate(managementQueryKeys.options, managementQueryKeys.categories),
    }),
    updateCategory: useMutation({
      mutationFn: ({ categoryId, active }: { categoryId: number; active: boolean }) => managementService.updateCategory(categoryId, { active }),
      onSuccess: () => invalidate(managementQueryKeys.options, managementQueryKeys.categories),
    }),
    createCourse: useMutation({
      mutationFn: (input: CourseInput) => managementService.createCourse(input),
      onSuccess: () => invalidate(managementQueryKeys.courses),
    }),
    updateCourse: useMutation({
      mutationFn: ({ courseId, input }: { courseId: string; input: Partial<CourseInput> }) => managementService.updateAdminCourse(courseId, input),
      onSuccess: () => invalidate(managementQueryKeys.courses),
    }),
    assignInstructor: useMutation({
      mutationFn: ({ courseId, instructorId }: { courseId: string; instructorId: string }) => managementService.assignInstructor(courseId, instructorId),
      onSuccess: () => invalidate(managementQueryKeys.courses),
    }),
    publish: useMutation({ mutationFn: managementService.publishCourse, onSuccess: () => invalidate(managementQueryKeys.courses) }),
    archive: useMutation({ mutationFn: managementService.archiveCourse, onSuccess: () => invalidate(managementQueryKeys.courses) }),
    restore: useMutation({ mutationFn: managementService.restoreCourse, onSuccess: () => invalidate(managementQueryKeys.courses) }),
    moderate: useMutation({
      mutationFn: ({ reviewId, visible, reason }: { reviewId: string; visible: boolean; reason?: string }) => managementService.moderateReview(reviewId, { visible, reason }),
      onSuccess: () => invalidate(managementQueryKeys.reviews),
    }),
    resolveApplication: useMutation({
      mutationFn: ({ applicationId, ...input }: { applicationId: string; decision: "approved" | "rejected"; observations?: string; specialty?: string; experienceYears?: number }) =>
        managementService.resolveInstructorApplication(applicationId, input),
      onSuccess: () => invalidate(managementQueryKeys.applications, managementQueryKeys.users, managementQueryKeys.instructors),
    }),
  };
}

export function useInstructorCourses(filters: ManagedCourseFilters = {}) {
  const { user } = useAuth();
  const scope = privateScope(user ?? undefined);
  return useQuery({
    queryKey: [...managementQueryKeys.instructorCourses, filters, ...scope],
    queryFn: () => managementService.listInstructorCourses(filters),
  });
}

export function useCourseOptions() {
  const { user } = useAuth();
  const scope = privateScope(user ?? undefined);
  return useQuery({ queryKey: [...managementQueryKeys.options, ...scope], queryFn: managementService.courseOptions });
}

export function useCourseContent(courseId: string) {
  const { user } = useAuth();
  const scope = privateScope(user ?? undefined);
  return useQuery({
    queryKey: [...managementQueryKeys.content(courseId), ...scope],
    queryFn: () => managementService.getCourseContent(courseId),
    enabled: Boolean(courseId),
  });
}

export function useResourceOptions() {
  const { user } = useAuth();
  const scope = privateScope(user ?? undefined);
  return useQuery({ queryKey: [...managementQueryKeys.resources, ...scope], queryFn: managementService.resourceOptions });
}

export function useInvalidateCourseContent(courseId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: managementQueryKeys.content(courseId) });
}
