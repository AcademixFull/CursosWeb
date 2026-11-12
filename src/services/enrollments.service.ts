import { env } from "../config/env";
import { createEnrollmentMock } from "../data/studentMocks";
import type { EnrollmentSummary } from "../types/student.types";
import { api } from "./api";

const MOCK_DELAY_MS = 220;

export async function enrollInCourse(courseId: string): Promise<EnrollmentSummary> {
  if (env.dataSource === "api") {
    const enrollment = await api.post<EnrollmentSummary>(`/courses/${encodeURIComponent(courseId)}/enrollments`);
    window.dispatchEvent(new Event("academix:enrolled"));
    return enrollment;
  }

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  const enrollment = createEnrollmentMock(courseId);
  if (!enrollment) throw new Error("No encontramos el curso que intentas agregar.");
  return enrollment;
}
