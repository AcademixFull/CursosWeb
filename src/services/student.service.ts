import { env } from "../config/env";
import { certificateMocks, enrollmentMocks } from "../data/studentMocks";
import type { AuthUser } from "../types/auth.types";
import type {
  CertificateSummary,
  EnrollmentSummary,
  UpdateProfileInput,
  UserProfile,
} from "../types/student.types";
import { api } from "./api";

const MOCK_DELAY_MS = 160;

function waitForMocks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
}

function createMockProfile(user: AuthUser, changes?: Partial<UpdateProfileInput>): UserProfile {
  return {
    id: user.id,
    fullName: changes?.fullName ?? user.fullName,
    email: user.email,
    role: user.role,
    phone: changes?.phone ?? "",
    country: changes?.country ?? "México",
    bio: changes?.bio ?? "",
  };
}

export async function listMyCourses(): Promise<EnrollmentSummary[]> {
  if (env.dataSource === "api") {
    return api.get<EnrollmentSummary[]>("/users/me/courses");
  }

  await waitForMocks();
  return enrollmentMocks;
}

export async function listMyCertificates(): Promise<CertificateSummary[]> {
  if (env.dataSource === "api") {
    return api.get<CertificateSummary[]>("/users/me/certificates");
  }

  await waitForMocks();
  return certificateMocks;
}

export async function getMyProfile(user: AuthUser): Promise<UserProfile> {
  if (env.dataSource === "api") {
    return api.get<UserProfile>("/users/me");
  }

  await waitForMocks();
  return createMockProfile(user);
}

export async function updateMyProfile(
  user: AuthUser,
  input: UpdateProfileInput,
): Promise<UserProfile> {
  if (env.dataSource === "api") {
    return api.patch<UserProfile>("/users/me", input);
  }

  await waitForMocks();
  return createMockProfile(user, input);
}
