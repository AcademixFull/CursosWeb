import { courseMocks } from "./courseMocks";
import type { CertificateSummary, EnrollmentSummary } from "../types/student.types";
import { MOCK_CERTIFICATE_DATES_KEY, MOCK_ENROLLMENTS_KEY } from "../utils/mockStudentStorage";

function getCourse(index: number) {
  const course = courseMocks[index];
  if (!course) throw new Error("Los datos mock del estudiante están incompletos.");
  return course;
}

const initialEnrollmentMocks: EnrollmentSummary[] = [
  {
    id: "enrollment-web",
    course: getCourse(0),
    status: "in_progress",
    progressPercentage: 50,
    completedLessons: 2,
    totalLessons: 4,
    lastAccessedAt: "2026-08-03T18:20:00.000Z",
  },
  {
    id: "enrollment-ml",
    course: getCourse(2),
    status: "in_progress",
    progressPercentage: 17,
    completedLessons: 1,
    totalLessons: 6,
    lastAccessedAt: "2026-08-01T21:10:00.000Z",
  },
  {
    id: "enrollment-ui",
    course: getCourse(1),
    status: "completed",
    progressPercentage: 100,
    completedLessons: 2,
    totalLessons: 2,
    lastAccessedAt: "2026-07-20T16:00:00.000Z",
  },
];

function readExtraEnrollmentIds(): string[] {
  try {
    const storedValue = sessionStorage.getItem(MOCK_ENROLLMENTS_KEY);
    const courseIds: unknown = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(courseIds) ? courseIds.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function createEnrollment(courseId: string): EnrollmentSummary | null {
  const course = courseMocks.find((item) => item.id === courseId || item.slug === courseId);
  if (!course) return null;

  const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0) || 1;
  return {
    id: `enrollment-${course.id}`,
    course,
    status: "in_progress",
    progressPercentage: 0,
    completedLessons: 0,
    totalLessons: lessonCount,
    lastAccessedAt: new Date().toISOString(),
  };
}

export function getEnrollmentMocks(): EnrollmentSummary[] {
  const existingCourseIds = new Set(initialEnrollmentMocks.map((enrollment) => enrollment.course.id));
  const extraEnrollments = readExtraEnrollmentIds()
    .filter((courseId) => !existingCourseIds.has(courseId))
    .map(createEnrollment)
    .filter((enrollment): enrollment is EnrollmentSummary => Boolean(enrollment));

  return [...initialEnrollmentMocks, ...extraEnrollments];
}

export function createEnrollmentMock(courseId: string): EnrollmentSummary | null {
  const currentEnrollments = getEnrollmentMocks();
  const existing = currentEnrollments.find(
    (enrollment) => enrollment.course.id === courseId || enrollment.course.slug === courseId,
  );
  if (existing) return existing;

  const enrollment = createEnrollment(courseId);
  if (!enrollment) return null;

  const extraCourseIds = new Set(readExtraEnrollmentIds());
  extraCourseIds.add(enrollment.course.id);
  sessionStorage.setItem(MOCK_ENROLLMENTS_KEY, JSON.stringify([...extraCourseIds]));
  return enrollment;
}

export function getMockCertificateIssuedAt(courseId: string): string {
  let dates: Record<string, string> = {};
  try {
    const storedValue = sessionStorage.getItem(MOCK_CERTIFICATE_DATES_KEY);
    const parsed: unknown = storedValue ? JSON.parse(storedValue) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      dates = Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    }
  } catch {
    dates = {};
  }

  if (dates[courseId]) return dates[courseId];

  const issuedAt = new Date().toISOString();
  sessionStorage.setItem(
    MOCK_CERTIFICATE_DATES_KEY,
    JSON.stringify({ ...dates, [courseId]: issuedAt }),
  );
  return issuedAt;
}

export const certificateMocks: CertificateSummary[] = [
  {
    id: "certificate-ui",
    courseId: getCourse(1).id,
    courseTitle: getCourse(1).title,
    issuedAt: "2026-07-21T12:00:00.000Z",
    credentialCode: "ACX-UI-2026-1842",
  },
];
