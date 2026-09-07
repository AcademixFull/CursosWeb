import { api } from "./api";
import type {
  CreateOrganizationInput,
  OrganizationCourseSummary,
  OrganizationMember,
  OrganizationRole,
  OrganizationSummary,
} from "../types/organization.types";

export const organizationService = {
  list: () => api.get<OrganizationSummary[]>("/organizations"),
  create: (input: CreateOrganizationInput) => api.post<OrganizationSummary>("/organizations", input),
  join: (joinCode: string, studentNumber: string) =>
    api.post<OrganizationSummary>("/organizations/join", { joinCode, studentNumber }),
  detail: (organizationId: string) => api.get<OrganizationSummary>(`/organizations/${encodeURIComponent(organizationId)}`),
  members: (organizationId: string) => api.get<OrganizationMember[]>(`/organizations/${encodeURIComponent(organizationId)}/members`),
  updateMemberRole: (organizationId: string, userId: string, role: OrganizationRole) =>
    api.patch<OrganizationMember>(
      `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
      { role },
    ),
  courses: (organizationId: string) => api.get<OrganizationCourseSummary[]>(`/organizations/${encodeURIComponent(organizationId)}/courses`),
};
