import type { UserRole } from "../types/auth.types";
import type {
  UserListFilters, BasicListFilters, ManagedCourseFilters, ApplicationListFilters, ReviewListFilters,
  AdminReview,
  AuthoringCourseContent,
  AuthoringLesson,
  AuthoringModule,
  AuthoringResource,
  CourseInput,
  CourseOptions,
  ManagedCourse,
  ManagedCategory,
  ManagedInstructor,
  ManagedUser,
  InstructorApplication,
  Paged,
  UploadedCourseFile,
} from "../types/management.types";
import { api } from "./api";

function query(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const managementService = {
  listUsers: async (filters: UserListFilters = {}): Promise<Paged<ManagedUser>> => {
    const result = await api.getPage<ManagedUser>(`/admin/users${query({ ...filters })}`);
    return result;
  },
  setUserRoles: (userId: string, roles: UserRole[]) =>
    api.patch<ManagedUser>(`/admin/users/${encodeURIComponent(userId)}/roles`, { roles }),
  setUserStatus: (userId: string, active: boolean) =>
    api.patch<ManagedUser>(`/admin/users/${encodeURIComponent(userId)}/status`, { active }),
  listInstructors: (filters: BasicListFilters = {}) => api.getPage<ManagedInstructor>(`/admin/instructors${query({ ...filters })}`),
  upsertInstructor: (userId: string, input: { specialty: string; experienceYears: number }) =>
    api.put<ManagedInstructor>(`/admin/instructors/${encodeURIComponent(userId)}`, input),
  listCategories: (filters: BasicListFilters = {}) => api.getPage<ManagedCategory>(`/admin/categories${query({ ...filters })}`),
  createCategory: (input: { name: string; slug?: string; description?: string }) =>
    api.post<{ id: number; name: string; slug: string }>("/admin/categories", input),
  updateCategory: (categoryId: number, input: { name?: string; slug?: string; description?: string; active?: boolean }) =>
    api.patch(`/admin/categories/${categoryId}`, input),
  courseOptions: () => api.get<CourseOptions>("/admin/course-options"),
  getMyInstructorApplication: () => api.get<InstructorApplication | null>("/users/me/instructor-application"),
  submitInstructorApplication: (input: { enrollmentId: string; credentialReference: string }) =>
    api.post<InstructorApplication>("/users/me/instructor-application", input),
  listInstructorApplications: (filters: ApplicationListFilters = {}) =>
    api.getPage<InstructorApplication>(`/admin/instructor-applications${query({ ...filters })}`),
  resolveInstructorApplication: (applicationId: string, input: { decision: "approved" | "rejected"; observations?: string; specialty?: string; experienceYears?: number }) =>
    api.patch<InstructorApplication>(`/admin/instructor-applications/${encodeURIComponent(applicationId)}`, input),
  listAdminCourses: async (filters: ManagedCourseFilters = {}): Promise<Paged<ManagedCourse>> =>
    api.getPage<ManagedCourse>(`/admin/courses${query({ ...filters })}`),
  createCourse: (input: CourseInput) => api.post<ManagedCourse>("/admin/courses", input),
  updateAdminCourse: (courseId: string, input: Partial<CourseInput>) =>
    api.patch<ManagedCourse>(`/admin/courses/${encodeURIComponent(courseId)}`, input),
  assignInstructor: (courseId: string, instructorId: string) =>
    api.put<ManagedCourse>(`/admin/courses/${encodeURIComponent(courseId)}/instructor`, { instructorId }),
  publishCourse: (courseId: string) => api.post<ManagedCourse>(`/admin/courses/${encodeURIComponent(courseId)}/publish`),
  archiveCourse: (courseId: string) => api.post<ManagedCourse>(`/admin/courses/${encodeURIComponent(courseId)}/archive`),
  restoreCourse: (courseId: string) => api.post<ManagedCourse>(`/admin/courses/${encodeURIComponent(courseId)}/restore`),
  listReviews: async (filters: ReviewListFilters = {}): Promise<Paged<AdminReview>> =>
    api.getPage<AdminReview>(`/admin/reviews${query({ ...filters })}`),
  moderateReview: (reviewId: string, input: { visible: boolean; reason?: string }) =>
    api.patch<AdminReview>(`/admin/reviews/${encodeURIComponent(reviewId)}/moderation`, input),
  listInstructorCourses: async (filters: ManagedCourseFilters = {}): Promise<Paged<ManagedCourse>> =>
    api.getPage<ManagedCourse>(`/instructor/courses${query({ ...filters })}`),
  createInstructorCourse: (input: CourseInput) => api.post<ManagedCourse>("/instructor/courses", input),
  updateInstructorCourse: (courseId: string, input: Partial<CourseInput>) =>
    api.patch<ManagedCourse>(`/instructor/courses/${encodeURIComponent(courseId)}`, input),
  submitInstructorCourse: (courseId: string) => api.post<ManagedCourse>(`/instructor/courses/${encodeURIComponent(courseId)}/submit`),
  archiveInstructorCourse: (courseId: string) => api.post<ManagedCourse>(`/instructor/courses/${encodeURIComponent(courseId)}/archive`),
  resourceOptions: () => api.get<Array<{ id: number; name: string }>>("/authoring/resource-options"),
  getCourseContent: (courseId: string) => api.get<AuthoringCourseContent>(`/authoring/courses/${encodeURIComponent(courseId)}/content`),
  createModule: (courseId: string, input: { title: string; description: string; position: number }) =>
    api.post<AuthoringModule>(`/authoring/courses/${encodeURIComponent(courseId)}/modules`, input),
  updateModule: (moduleId: string, input: Partial<Pick<AuthoringModule, "title" | "description" | "position" | "active">>) =>
    api.patch<AuthoringModule>(`/authoring/modules/${encodeURIComponent(moduleId)}`, input),
  createLesson: (moduleId: string, input: { title: string; description: string; content: string; durationMinutes: number; position: number; isPreview: boolean }) =>
    api.post<AuthoringLesson>(`/authoring/modules/${encodeURIComponent(moduleId)}/lessons`, input),
  updateLesson: (lessonId: string, input: Partial<Omit<AuthoringLesson, "id" | "resources">>) =>
    api.patch<AuthoringLesson>(`/authoring/lessons/${encodeURIComponent(lessonId)}`, input),
  createResource: (lessonId: string, input: { typeId: number; title: string; description: string; url: string | null; fileId: string | null; required: boolean; position: number }) =>
    api.post<AuthoringResource>(`/authoring/lessons/${encodeURIComponent(lessonId)}/resources`, input),
  updateResource: (resourceId: string, input: Partial<Omit<AuthoringResource, "id" | "type">>) =>
    api.patch<AuthoringResource>(`/authoring/resources/${encodeURIComponent(resourceId)}`, input),
  uploadCourseFile: (courseId: string, file: File) => {
    if (file.size > 25 * 1024 * 1024) throw new Error("El archivo no puede superar 25 MB.");
    return api.postBinary<UploadedCourseFile>(`/authoring/courses/${encodeURIComponent(courseId)}/files`, file, {
      headers: { "Content-Type": file.type || "application/octet-stream", "x-file-name": file.name },
    });
  },
};
