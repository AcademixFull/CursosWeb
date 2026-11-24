import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { api } from "../services/api";
import { env } from "../config/env";
import {
  getMyProfile,
  getMyCertificate,
  listMyCertificates,
  listMyCoursesPage,
  listMyCertificatesPage,
  getCourseOwnership,
  type LibraryFilters,
  updateMyProfile,
} from "../services/student.service";
import type { UpdateProfileInput } from "../types/student.types";

export const studentQueryKeys = {
  courses: (userId: string) => ["student", userId, "courses"] as const,
  certificates: (userId: string) => ["student", userId, "certificates"] as const,
  certificate: (certificateId: string, userId: string) =>
    ["student", userId, "certificates", certificateId] as const,
  profile: (userId: string) => ["student", userId, "profile"] as const,
};

export function useLearningSummary() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["student", user?.id ?? "anonymous", "learning-summary"],
    queryFn: ({ signal }) => api.get<{ inProgress: number; completed: number; certificates: number; learningHours: number }>("/users/me/learning-summary", { signal }),
    enabled: Boolean(user), staleTime: env.cache?.libraryTtlMs ?? 30_000 });
}

export function useMyCourses(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentQueryKeys.courses(user?.id ?? "anonymous"),
    queryFn: async ({ signal }) => (await listMyCoursesPage({}, signal)).items,
    staleTime: env.cache?.libraryTtlMs ?? 30_000,
    networkMode: "always",
    enabled: enabled && Boolean(user),
  });
}


export function useMyCoursesPage(filters: LibraryFilters = {}, enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...studentQueryKeys.courses(user?.id ?? "anonymous"), filters],
    queryFn: ({ signal }) => listMyCoursesPage(filters, signal), networkMode: "always",
    enabled: enabled && Boolean(user), staleTime: env.cache?.libraryTtlMs ?? 30_000 });
}

export function useCourseOwnership(courseIds: string[]) {
  const { user } = useAuth();
  const ids = [...new Set(courseIds)].sort();
  return useQuery({ queryKey: ["student", user?.id ?? "anonymous", "ownership", ids],
    queryFn: ({ signal }) => getCourseOwnership(ids, signal), enabled: Boolean(user) && ids.length > 0,
    staleTime: env.cache?.libraryTtlMs ?? 30_000 });
}

export function useMyCertificatesPage(page = 1, limit = 10) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...studentQueryKeys.certificates(user?.id ?? "anonymous"), { page, limit }],
    queryFn: ({ signal }) => listMyCertificatesPage(page, limit, signal), enabled: Boolean(user) });
}

export function useMyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentQueryKeys.certificates(user?.id ?? "anonymous"),
    queryFn: listMyCertificates,
    enabled: Boolean(user),
  });
}

export function useMyCertificate(certificateId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: studentQueryKeys.certificate(certificateId, user?.id ?? "anonymous"),
    queryFn: () => {
      if (!user) throw new Error("No existe una sesión activa.");
      return getMyCertificate(certificateId, user);
    },
    enabled: Boolean(certificateId && user),
  });
}

export function useMyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: studentQueryKeys.profile(user?.id ?? "anonymous"),
    queryFn: () => {
      if (!user) throw new Error("No existe una sesión activa.");
      return getMyProfile(user);
    },
    enabled: Boolean(user),
  });
}

export function useUpdateMyProfile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!user) throw new Error("No existe una sesión activa.");
      return updateMyProfile(user, input);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(studentQueryKeys.profile(profile.id), profile);
      updateUser({ fullName: profile.fullName });
    },
  });
}
