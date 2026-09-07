import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "../services/organization.service";
import type { CreateOrganizationInput, OrganizationRole } from "../types/organization.types";

export const organizationQueryKeys = {
  all: ["organizations"] as const,
  members: (id: string) => ["organizations", id, "members"] as const,
  courses: (id: string) => ["organizations", id, "courses"] as const,
};

export function useOrganizations() {
  return useQuery({ queryKey: organizationQueryKeys.all, queryFn: organizationService.list });
}

export function useOrganizationWorkspace(organizationId?: string, canAdmin = false) {
  const client = useQueryClient();
  const enabled = Boolean(organizationId);
  const members = useQuery({
    queryKey: organizationQueryKeys.members(organizationId ?? ""),
    queryFn: () => organizationService.members(organizationId!),
    enabled: enabled && canAdmin,
  });
  const courses = useQuery({
    queryKey: organizationQueryKeys.courses(organizationId ?? ""),
    queryFn: () => organizationService.courses(organizationId!),
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
    onSuccess: () => client.invalidateQueries({ queryKey: organizationQueryKeys.members(organizationId ?? "") }),
  });
  return { members, courses, create, join, setRole };
}
