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
  courses: ["student", "courses"] as const,
  certificates: ["student", "certificates"] as const,
  certificate: (certificateId: string, userId: string) =>
    ["student", "certificates", certificateId, userId] as const,
  profile: (userId: string) => ["student", "profile", userId] as const,
};

export function useMyCourses(enabled = true) {
  return useQuery({ queryKey: studentQueryKeys.courses, queryFn: listMyCourses, enabled });
}

export function useMyCertificates() {
  return useQuery({ queryKey: studentQueryKeys.certificates, queryFn: listMyCertificates });
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
