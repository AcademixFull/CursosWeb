import { useAuth } from "./useAuth";
import { privateScope } from "../utils/queryClient";
import type { BasicListFilters, ManagedCourseFilters } from "../types/management.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "../services/organization.service";
import type { CreateOrganizationInput, OrganizationRole } from "../types/organization.types";

export const organizationQueryKeys = {
  all: ["organizations"] as const,
  members: (id: string) => ["organizations", id, "members"] as const,
  courses: (id: string) => ["organizations", id, "courses"] as const,
};

export function useOrganizations() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...organizationQueryKeys.all, ...privateScope(user ?? undefined)], queryFn: organizationService.list, enabled: Boolean(user) });
}

export function useOrganizationWorkspace(organizationId?: string, canAdmin = false, memberFilters: BasicListFilters & { role?: OrganizationRole } = {}, courseFilters: ManagedCourseFilters = {}) {
  const client = useQueryClient();
  const { user } = useAuth();
  const identity = privateScope(user ?? undefined);
  const enabled = Boolean(organizationId && user);
  const members = useQuery({
    queryKey: [...organizationQueryKeys.members(organizationId ?? ""), memberFilters, ...identity],
    queryFn: () => organizationService.members(organizationId!, memberFilters),
    enabled: enabled && canAdmin,
  });
  const courses = useQuery({
    queryKey: [...organizationQueryKeys.courses(organizationId ?? ""), courseFilters, ...identity],
    queryFn: () => organizationService.courses(organizationId!, courseFilters),
    enabled,
  });
  const create = useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationService.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
  const join = useMutation({
    mutationFn: ({ code, studentNumber }: { code: string; studentNumber: string }) =>
      organizationService.join(code, studentNumber),
    onSuccess: () => client.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrganizationRole }) =>
      organizationService.updateMemberRole(organizationId!, userId, role),
    onSuccess: () => client.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
  const assignInstructor = useMutation({
    mutationFn: ({ courseId, instructorId }: { courseId: string; instructorId: string }) => organizationService.assignInstructor(organizationId!, courseId, instructorId),
    onSuccess: () => client.invalidateQueries({ queryKey: organizationQueryKeys.courses(organizationId ?? "") }),
  });
  return { members, courses, create, join, setRole, assignInstructor };
}
