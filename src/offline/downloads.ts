import { api, ApiError, type ApiBinary } from "../services/api";
import type { LearningCourse } from "../types/learning.types";
import type { EnrollmentSummary } from "../types/student.types";
import { canSync, currentOfflineUser, resourcePath } from "./learning";
import { offlineStore } from "./store";

export interface DownloadState {
  courseId: string;
  title: string;
  status: "downloading" | "ready" | "partial" | "error";
  savedFiles: number;
  totalFiles: number;
  externalResources: number;
}

export async function downloadCourse(user: string, courseId: string, refresh = false, revision = offlineStore.generation(user)): Promise<DownloadState> {
  const state: DownloadState = { courseId, title: courseId, status: "downloading", savedFiles: 0, totalFiles: 0, externalResources: 0 };
  try {
    if (!canSync(user) || offlineStore.generation(user) !== revision) throw new Error("Conéctate e inicia sesión para descargar tus cursos.");
    const course = await api.get<LearningCourse>(`/users/me/courses/${encodeURIComponent(courseId)}/learning`);
    if (currentOfflineUser() !== user || offlineStore.generation(user) !== revision) throw new Error("La cuenta cambió durante la descarga.");
    state.title = course.title;
    const resources = course.modules.flatMap((m) => m.lessons.flatMap((l) => l.resources));
    const files = resources.filter((r) => r.contentPath && !r.url);
    state.totalFiles = files.length;
    state.externalResources = resources.filter((r) => r.url || !r.contentPath).length;
    await offlineStore.saveCourse(user, course, revision);
    await offlineStore.put(user, "download", courseId, state, revision);
    for (const resource of files) {
      if (!canSync(user) || offlineStore.generation(user) !== revision) throw new Error("La descarga se interrumpió. Puedes reintentar cuando vuelvas a conectarte.");
      const path = resourcePath(resource);
      if (refresh || !await offlineStore.get(user, "resource", path)) {
        const file = await api.getBinary(path);
        if (currentOfflineUser() !== user || offlineStore.generation(user) !== revision) throw new Error("La cuenta cambió durante la descarga.");
        await offlineStore.put(user, "resource", path, { ...file, accessExpiresAt: course.accessExpiresAt }, revision);
      } else {
        const file = await offlineStore.get<ApiBinary>(user, "resource", path);
        if (file) await offlineStore.put(user, "resource", path, { ...file, accessExpiresAt: course.accessExpiresAt }, revision);
      }
      state.savedFiles++;
      await offlineStore.put(user, "download", courseId, state, revision);
    }
    state.status = state.externalResources ? "partial" : "ready";
    await offlineStore.put(user, "download", courseId, state, revision);
    return state;
  } catch (error) {
    if (offlineStore.generation(user) !== revision) throw error;
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      await offlineStore.removeCourse(user, courseId);
      throw error;
    }
    state.status = "error";
    await offlineStore.put(user, "download", courseId, state, revision);
    throw error;
  }
}

export async function downloadLibrary(user: string, enrollments: EnrollmentSummary[], refresh = false): Promise<void> {
  const revision = offlineStore.generation(user);
  await offlineStore.put(user, "library", "enrollments", enrollments, revision);
  const enrolledIds = new Set(enrollments.map((e) => e.course.id));
  for (const cached of await offlineStore.list<LearningCourse>(user, "course")) {
    if (!enrolledIds.has(cached.id)) await offlineStore.removeCourse(user, cached.id);
  }
  // Each course is independent: one failed file must not prevent the rest of the library.
  let failed = false;
  for (const enrollment of enrollments) {
    if (!canSync(user) || offlineStore.generation(user) !== revision) break;
    try { await downloadCourse(user, enrollment.course.id, refresh, revision); } catch { failed = true; }
  }
  if (failed) throw new Error("Algunos cursos no terminaron de descargarse. Reintenta con conexión y espacio disponible.");
}

export async function cachedLibrary(user: string): Promise<EnrollmentSummary[] | undefined> {
  const enrollments = await offlineStore.get<EnrollmentSummary[]>(user, "library", "enrollments");
  if (!enrollments) return undefined;
  return Promise.all(enrollments.map(async (enrollment) => {
    const course = await offlineStore.get<LearningCourse>(user, "course", enrollment.course.id);
    return course ? { ...enrollment, completedLessons: course.completedLessons,
      totalLessons: course.totalLessons, progressPercentage: course.progressPercentage,
      status: course.progressPercentage === 100 ? "completed" as const : "in_progress" as const } : enrollment;
  }));
}
