import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  getMyProfile,
  getMyCertificate,
  listMyCertificates,
  listMyCourses,
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

export function useMyCourses(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentQueryKeys.courses(user?.id ?? "anonymous"),
    queryFn: listMyCourses,
    enabled: enabled && Boolean(user),
  });
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
