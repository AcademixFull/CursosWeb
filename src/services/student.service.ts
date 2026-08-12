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
      const shortCode = enrollment.course.id.replace(/^course-/, "").toUpperCase().slice(0, 12);
      certificatesByCourse.set(enrollment.course.id, {
        id: `certificate-${enrollment.course.id}`,
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        issuedAt: getMockCertificateIssuedAt(enrollment.course.id),
        credentialCode: `ACX-${shortCode}-2026`,
      });
    }
  }

  return [...certificatesByCourse.values()];
}

export async function listMyCourses(): Promise<EnrollmentSummary[]> {
  if (env.dataSource === "api") {
    return api.get<EnrollmentSummary[]>("/users/me/courses");
  }

  await waitForMocks();
  return getEnrollmentMocks().map((enrollment) => {
    const learningCourse = getLearningCourseMock(enrollment.course.id);
    if (!learningCourse?.totalLessons) return enrollment;

    return {
      ...enrollment,
      progressPercentage: learningCourse.progressPercentage,
      completedLessons: learningCourse.completedLessons,
      totalLessons: learningCourse.totalLessons,
      status: learningCourse.progressPercentage === 100 ? "completed" : "in_progress",
    };
  });
}

export async function listMyCertificates(): Promise<CertificateSummary[]> {
  if (env.dataSource === "api") {
    return api.get<CertificateSummary[]>("/users/me/certificates");
  }

  await waitForMocks();
  return buildMockCertificates();
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
