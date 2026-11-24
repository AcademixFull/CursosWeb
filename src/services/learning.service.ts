import { env } from "../config/env";
import { getLearningCourseMock, setLearningLessonProgressMock } from "../data/learningMocks";
import type { LearningCourse, LearningResource } from "../types/learning.types";
import { api, type ApiBinary } from "./api";
import { currentOfflineUser, loadLearningWithOffline, loadResourceWithOffline, loadOfflineCourse, saveOfflineProgress, syncOfflineProgress } from "../offline/learning";

const MOCK_DELAY_MS = 140;

function waitForMocks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
}

export async function getLearningCourse(courseId: string): Promise<LearningCourse> {
  if (env.dataSource === "api") {
    const user = currentOfflineUser();
    if (user && typeof indexedDB !== "undefined") return loadLearningWithOffline(user, courseId);
    return api.get<LearningCourse>(`/users/me/courses/${encodeURIComponent(courseId)}/learning`);
  }

  await waitForMocks();
  const course = getLearningCourseMock(courseId);
  if (!course) throw new Error("No encontramos este curso en tu biblioteca.");
  if (!course.totalLessons) throw new Error("Este curso todavía no tiene lecciones publicadas.");
  return course;
}

export async function setLearningLessonProgress(
  courseId: string,
  lessonId: string,
  completed: boolean,
): Promise<LearningCourse> {
  if (env.dataSource === "api") {
    const user = currentOfflineUser();
    if (user && typeof indexedDB !== "undefined" && await loadOfflineCourse(user, courseId)) {
      const updated = await saveOfflineProgress(user, courseId, lessonId, completed);
      // Persist first; retry is coordinated globally and survives a page close.
      void syncOfflineProgress(user).catch(() => undefined);
      return updated;
    }
    await api.patch<void>(`/lessons/${encodeURIComponent(lessonId)}/progress`, { completed });
    return getLearningCourse(courseId);
  }

  await waitForMocks();
  const course = setLearningLessonProgressMock(courseId, lessonId, completed);
  if (!course) throw new Error("No pudimos actualizar el progreso de la lección.");
  return course;
}

function backendRelativePath(contentPath: string): string {
  return contentPath.replace(/^\/api\/v1(?=\/)/, "");
}

export async function getLearningResourceContent(
  resource: LearningResource,
  signal?: AbortSignal,
): Promise<ApiBinary> {
  if (!resource.contentPath) {
    throw new Error("Este recurso no contiene un archivo descargable.");
  }
  const user = currentOfflineUser();
  if (user && typeof indexedDB !== "undefined") return loadResourceWithOffline(user, resource, signal);
  return api.getBinary(backendRelativePath(resource.contentPath), { signal });
}
