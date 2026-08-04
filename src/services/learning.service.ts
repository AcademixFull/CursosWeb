import { env } from "../config/env";
import { completeLearningLessonMock, getLearningCourseMock } from "../data/learningMocks";
import type { LearningCourse } from "../types/learning.types";
import { api } from "./api";

const MOCK_DELAY_MS = 140;

function waitForMocks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
}

export async function getLearningCourse(courseId: string): Promise<LearningCourse> {
  if (env.dataSource === "api") {
    return api.get<LearningCourse>(`/users/me/courses/${encodeURIComponent(courseId)}/learning`);
  }

  await waitForMocks();
  const course = getLearningCourseMock(courseId);
  if (!course) throw new Error("No encontramos este curso en tu biblioteca.");
  if (!course.totalLessons) throw new Error("Este curso todavía no tiene lecciones publicadas.");
  return course;
}

export async function completeLearningLesson(
  courseId: string,
  lessonId: string,
): Promise<LearningCourse> {
  if (env.dataSource === "api") {
    await api.patch<void>(`/lessons/${encodeURIComponent(lessonId)}/progress`, { completed: true });
    return getLearningCourse(courseId);
  }

  await waitForMocks();
  const course = completeLearningLessonMock(courseId, lessonId);
  if (!course) throw new Error("No pudimos actualizar el progreso de la lección.");
  return course;
}
