import { api, ApiError, type ApiBinary } from "../services/api";
import type { LearningCourse, LearningResource } from "../types/learning.types";
import { getAuthToken, readAuthSession } from "../utils/authSessionStore";
import { offlineStore, type PendingProgress } from "./store";
import { assertOfflineAccess } from "./access";

export const isConnectivityError = (error: unknown) => error instanceof ApiError && error.code === "NETWORK_ERROR";
export function currentOfflineUser(): string | undefined { return readAuthSession()?.user.id; }
export function canSync(user: string): boolean {
  return navigator.onLine && currentOfflineUser() === user && Boolean(getAuthToken());
}
export async function loadOfflineCourse(user: string, courseId: string) {
  const course = await offlineStore.get<LearningCourse>(user, "course", courseId);
  if (course) assertOfflineAccess(course.accessExpiresAt);
  return course;
}
export async function saveOfflineProgress(user: string, courseId: string, lessonId: string, completed: boolean) {
  await loadOfflineCourse(user, courseId);
  return offlineStore.queueProgress(user, courseId, lessonId, completed);
}

const syncing = new Map<string, Promise<number>>();
export function syncOfflineProgress(user: string, retryRejected = false): Promise<number> {
  const active = syncing.get(user);
  if (active) return active;
  const revision = offlineStore.generation(user);
  const run = async () => {
    if (!canSync(user) || offlineStore.generation(user) !== revision) return 0;
    let count = 0;
    for (const pending of await offlineStore.list<PendingProgress>(user, "pending")) {
      if (!canSync(user) || offlineStore.generation(user) !== revision) break;
      if (pending.error && !retryRejected) continue;
      try {
        await api.patch<void>(`/lessons/${encodeURIComponent(pending.lessonId)}/progress`, { completed: pending.completed });
      } catch (error) {
        if (offlineStore.generation(user) !== revision) throw new DOMException("Session changed", "AbortError");
        if (error instanceof ApiError && [403, 404, 422].includes(error.status)) {
          await offlineStore.rejectProgress(user, pending, error.message);
          if ([403, 404].includes(error.status)) await offlineStore.removeCourse(user, pending.courseId);
          continue;
        }
        throw error;
      }
      // A late response must not delete an edit made while the request was in flight.
      if (!canSync(user) || offlineStore.generation(user) !== revision) break;
      await offlineStore.ackProgress(user, pending.lessonId, pending.revision);
      count++;
    }
    if (count && canSync(user)) window.dispatchEvent(new CustomEvent("academix:offline-synced", { detail: user }));
    return count;
  };
  const promise = (navigator.locks
    ? navigator.locks.request(`academix-progress:${user}`, run)
    : run()).finally(() => { syncing.delete(user); });
  syncing.set(user, promise);
  return promise;
}

export async function loadLearningWithOffline(user: string, courseId: string): Promise<LearningCourse> {
  const revision = offlineStore.generation(user);
  if (!navigator.onLine || !getAuthToken()) {
    const cached = await loadOfflineCourse(user, courseId);
    if (cached) return cached;
    throw new Error("Este curso todavía no está descargado. Conéctate para prepararlo.");
  }
  try {
    const course = await api.get<LearningCourse>(`/users/me/courses/${encodeURIComponent(courseId)}/learning`);
    if (currentOfflineUser() !== user || offlineStore.generation(user) !== revision) throw new Error("La cuenta cambió. Abre el curso nuevamente.");
    // Online reading must remain available even if the device cannot store a download.
    try { return await offlineStore.saveCourse(user, course, revision); } catch { return course; }
  } catch (error) {
    if (offlineStore.generation(user) !== revision) throw new DOMException("Session changed", "AbortError");
    if (error instanceof ApiError && [403, 404].includes(error.status)) await offlineStore.removeCourse(user, courseId);
    if (isConnectivityError(error)) {
      const cached = await loadOfflineCourse(user, courseId);
      if (cached) return cached;
    }
    throw error;
  }
}

export function resourcePath(resource: LearningResource): string {
  if (!resource.contentPath || !/^\/api\/v1\/lessons\/[^/]+\/resources\/[^/]+\/content$/.test(resource.contentPath)) {
    throw new Error("Este recurso no contiene un archivo descargable.");
  }
  return resource.contentPath.replace(/^\/api\/v1/, "");
}

export async function loadResourceWithOffline(user: string, resource: LearningResource, signal?: AbortSignal): Promise<ApiBinary> {
  const path = resourcePath(resource);
  const revision = offlineStore.generation(user);
  const cachedFile = async () => {
    if (resource.accessExpiresAt !== undefined) assertOfflineAccess(resource.accessExpiresAt);
    const file = await offlineStore.get<ApiBinary & { accessExpiresAt?: string | null }>(user, "resource", path);
    if (file) assertOfflineAccess(file.accessExpiresAt);
    return file;
  };
  if (!navigator.onLine || !getAuthToken()) {
    const cached = await cachedFile();
    if (cached) return cached;
    throw new Error("Este archivo no está descargado. Conéctate para abrirlo.");
  }
  try {
    const file = await api.getBinary(path, { signal });
    if (currentOfflineUser() === user && offlineStore.generation(user) === revision) {
      try { await offlineStore.put(user, "resource", path, { ...file, accessExpiresAt: resource.accessExpiresAt }, revision); } catch { /* Online preview still works. */ }
    }
    return file;
  } catch (error) {
    if (offlineStore.generation(user) !== revision) throw new DOMException("Session changed", "AbortError");
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      await offlineStore.remove(user, "resource", path);
    }
    if (isConnectivityError(error)) {
      const cached = await cachedFile();
      if (cached) return cached;
    }
    throw error;
  }
}
