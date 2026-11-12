import { env } from "../config/env";
import { courseMocks } from "../data/courseMocks";
import {
  certificateMocks,
  getEnrollmentMocks,
  getMockCertificateIssuedAt,
} from "../data/studentMocks";
import { getLearningCourseMock } from "../data/learningMocks";
import type { AuthUser } from "../types/auth.types";
import type {
  CertificateSummary,
  CertificateDetail,
  EnrollmentSummary,
  UpdateProfileInput,
  UserProfile,
} from "../types/student.types";
import { readMockProfile, saveMockProfile } from "../utils/mockStudentStorage";
import { api, type ApiPage } from "./api";
import { cachedLibrary } from "../offline/downloads";
import { currentOfflineUser, isConnectivityError } from "../offline/learning";
import { offlineStore } from "../offline/store";

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

function buildMockCertificates(): CertificateSummary[] {
  const certificatesByCourse = new Map(
    certificateMocks.map((certificate) => [certificate.courseId, certificate]),
  );

  for (const enrollment of getEnrollmentMocks()) {
    const learningCourse = getLearningCourseMock(enrollment.course.id);
    if (
      learningCourse?.progressPercentage === 100 &&
      enrollment.course.certificateEnabled &&
      !certificatesByCourse.has(enrollment.course.id)
    ) {
      const shortCode = enrollment.course.id
        .replace(/[^a-f0-9]/gi, "")
        .toUpperCase()
        .padEnd(12, "0")
        .slice(0, 12);
      certificatesByCourse.set(enrollment.course.id, {
        id: `certificate-${enrollment.course.id}`,
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        issuedAt: getMockCertificateIssuedAt(enrollment.course.id),
        credentialCode: `ACX-${new Date().getFullYear()}-${shortCode}`,
      });
    }
  }

  return [...certificatesByCourse.values()];
}

export interface LibraryFilters {
  page?: number;
  limit?: number;
  status?: "in_progress" | "completed";
  courseIds?: string[];
}

export async function listMyCoursesPage(filters: LibraryFilters = {}, signal?: AbortSignal): Promise<ApiPage<EnrollmentSummary>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const user = currentOfflineUser();
  const offlinePage = async () => {
    const library = user ? await cachedLibrary(user) : null;
    if (!library) throw new Error("Tu biblioteca aún no está descargada. Conéctate para prepararla.");
    const records = library.filter((item) => (!filters.status || item.status === filters.status)
      && (!filters.courseIds || filters.courseIds.includes(item.course.id)));
    return { items: records.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: records.length } };
  };
  if (env.dataSource === "api") {
    if (!navigator.onLine) return offlinePage();
    try {
      const result = await api.getPage<EnrollmentSummary>("/users/me/courses", {
        params: { page, limit, ...(filters.status ? { status: filters.status } : {}), ...(filters.courseIds ? { courseIds: filters.courseIds.join(",") } : {}) }, signal,
      });
      return result;
    } catch (error) {
      if (isConnectivityError(error)) return offlinePage();
      throw error;
    }
  }
  await waitForMocks();
  const records = getEnrollmentMocks().filter((item) => (!filters.status || item.status === filters.status)
    && (!filters.courseIds || filters.courseIds.includes(item.course.id)));
  return { items: records.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: records.length } };
}

// Only the offline downloader traverses the library, one bounded server page at a time.
export async function listMyCourses(signal?: AbortSignal): Promise<EnrollmentSummary[]> {
  const user = currentOfflineUser();
  const revision = user ? offlineStore.generation(user) : undefined;
  const records: EnrollmentSummary[] = [];
  for (let page = 1; ; page++) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const result = await listMyCoursesPage({ page, limit: 50 }, signal);
    records.push(...result.items);
    if (records.length >= result.pagination.total || result.items.length === 0) break;
    if (currentOfflineUser() !== user) throw new DOMException("Account changed", "AbortError");
  }
  if (user && currentOfflineUser() === user && typeof indexedDB !== "undefined") {
    try { await offlineStore.put(user, "library", "enrollments", records, revision); } catch { /* Download errors are reported separately. */ }
  }
  return records;
}

export async function getCourseOwnership(courseIds: string[], signal?: AbortSignal): Promise<string[]> {
  if (!courseIds.length) return [];
  if (env.dataSource === "api") {
    return api.get<string[]>("/users/me/course-ownership", { params: { courseIds: courseIds.join(",") }, signal });
  }
  return getEnrollmentMocks().filter((item) => courseIds.includes(item.course.id)).map((item) => item.course.id);
}

export async function listMyCertificatesPage(page = 1, limit = 10, signal?: AbortSignal): Promise<ApiPage<CertificateSummary>> {
  if (env.dataSource === "api") return api.getPage<CertificateSummary>("/users/me/certificates", { params: { page, limit }, signal });
  await waitForMocks();
  const records = buildMockCertificates();
  return { items: records.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: records.length } };
}

export async function listMyCertificates(): Promise<CertificateSummary[]> {
  return (await listMyCertificatesPage()).items;
}

export async function getMyCertificate(
  certificateId: string,
  user: AuthUser,
): Promise<CertificateDetail> {
  if (env.dataSource === "api") {
    return api.get<CertificateDetail>(`/users/me/certificates/${encodeURIComponent(certificateId)}`);
  }

  await waitForMocks();
  const certificate = buildMockCertificates().find((item) => item.id === certificateId);
  if (!certificate) throw new Error("No encontramos el certificado solicitado.");

  const course = courseMocks.find((item) => item.id === certificate.courseId);
  if (!course) throw new Error("No encontramos la información académica del certificado.");

  return {
    ...certificate,
    recipientName: user.fullName,
    durationHours: course.durationHours,
    issuerName: "Academix",
    systemSignature: "A".repeat(64),
    signatureAlgorithm: "SHA-256",
    verificationPath: `/api/v1/certificates/verify/${certificate.credentialCode}`,
  };
}

export async function getMyProfile(user: AuthUser): Promise<UserProfile> {
  if (env.dataSource === "api") {
    return api.get<UserProfile>("/users/me");
  }

  await waitForMocks();
  return createMockProfile(user, readMockProfile(user.id));
}

export async function updateMyProfile(
  user: AuthUser,
  input: UpdateProfileInput,
): Promise<UserProfile> {
  if (env.dataSource === "api") {
    return api.patch<UserProfile>("/users/me", input);
  }

  await waitForMocks();
  saveMockProfile(user.id, input);
  return createMockProfile(user, input);
}
