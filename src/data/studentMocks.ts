import { courseMocks } from "./courseMocks";
import type { CertificateSummary, EnrollmentSummary } from "../types/student.types";

function getCourse(index: number) {
  const course = courseMocks[index];
  if (!course) throw new Error("Los datos mock del estudiante están incompletos.");
  return course;
}

export const enrollmentMocks: EnrollmentSummary[] = [
  {
    id: "enrollment-web",
    course: getCourse(0),
    status: "in_progress",
    progressPercentage: 46,
    completedLessons: 11,
    totalLessons: 24,
    lastAccessedAt: "2026-08-03T18:20:00.000Z",
  },
  {
    id: "enrollment-ml",
    course: getCourse(2),
    status: "in_progress",
    progressPercentage: 18,
    completedLessons: 7,
    totalLessons: 38,
    lastAccessedAt: "2026-08-01T21:10:00.000Z",
  },
  {
    id: "enrollment-ui",
    course: getCourse(1),
    status: "completed",
    progressPercentage: 100,
    completedLessons: 18,
    totalLessons: 18,
    lastAccessedAt: "2026-07-20T16:00:00.000Z",
  },
];

export const certificateMocks: CertificateSummary[] = [
  {
    id: "certificate-ui",
    courseId: getCourse(1).id,
    courseTitle: getCourse(1).title,
    issuedAt: "2026-07-21T12:00:00.000Z",
    credentialCode: "ACX-UI-2026-1842",
  },
];
