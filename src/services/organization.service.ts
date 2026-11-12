import type { BasicListFilters, ManagedCourseFilters } from "../types/management.types";
import { api } from "./api";
import type {
  CreateOrganizationInput,
  OrganizationCourseSummary,
  OrganizationMember,
  OrganizationRole,
  OrganizationSummary,
} from "../types/organization.types";

function query(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params.toString()}` : "";
}

export const organizationService = {
  list: () => api.get<OrganizationSummary[]>("/organizations"),
  remove: (organizationId: string) => api.delete<{ deleted: boolean }>(`/organizations/${encodeURIComponent(organizationId)}`),
  create: (input: CreateOrganizationInput) => api.post<OrganizationSummary>("/organizations", input),
  join: (joinCode: string, studentNumber: string) =>
    api.post<OrganizationSummary>("/organizations/join", { joinCode, studentNumber }),
  detail: (organizationId: string) => api.get<OrganizationSummary>(`/organizations/${encodeURIComponent(organizationId)}`),
  members: (organizationId: string, filters: BasicListFilters & { role?: OrganizationRole } = {}) => api.getPage<OrganizationMember>(`/organizations/${encodeURIComponent(organizationId)}/members${query({ ...filters })}`),
  updateMemberRole: (organizationId: string, userId: string, role: OrganizationRole) =>
    api.patch<OrganizationMember>(
      `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
      { role },
    ),
  courses: (organizationId: string, filters: ManagedCourseFilters = {}) => api.getPage<OrganizationCourseSummary>(`/organizations/${encodeURIComponent(organizationId)}/courses${query({ ...filters })}`),
  assignInstructor: (organizationId: string, courseId: string, instructorId: string) => api.put(`/organizations/${encodeURIComponent(organizationId)}/courses/${encodeURIComponent(courseId)}/instructor`, { instructorId }),
};
