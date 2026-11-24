import { env } from "../config/env";
import type { LearningCourse } from "../types/learning.types";
import { assertOfflineAccess } from "./access";

export const OFFLINE_CHANGED = "academix:offline-changed";
const scope = `${env.apiUrl}|${env.dataSource}|${import.meta.env.BASE_URL}`;
type Kind = "library" | "course" | "resource" | "pending" | "download";
type Key = [string, string, Kind, string];
interface Row<T> { key: Key; value: T }
export interface PendingProgress {
  courseId: string; lessonId: string; completed: boolean; revision: string;
  error?: string;
}
let connection: Promise<IDBDatabase> | undefined;
const generations = new Map<string, number>();
const revoked = new Set<string>();
const generation = (user: string) => generations.get(user) ?? 0;
const writable = (user: string, revision: number) => !revoked.has(user) && generation(user) === revision;

function open(): Promise<IDBDatabase> {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open("academix-offline", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records", { keyPath: "key" });
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); connection = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { connection = undefined; reject(request.error); };
  });
  return connection;
}

function key(user: string, kind: Kind, id: string): Key { return [scope, user, kind, id]; }
function range(user: string, kind: Kind): IDBKeyRange {
  return IDBKeyRange.bound(key(user, kind, ""), key(user, kind, "\uffff"));
}
function changed() { window.dispatchEvent(new Event(OFFLINE_CHANGED)); }

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", mode);
    let value: T;
    tx.oncomplete = () => { if (mode === "readwrite") changed(); resolve(value); };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("No se pudo guardar el contenido en el dispositivo."));
    run(tx.objectStore("records"), (next) => { value = next; });
  });
}

function withProgress(course: LearningCourse, pending: PendingProgress[]): LearningCourse {
  const states = new Map(pending.filter((p) => p.courseId === course.id).map((p) => [p.lessonId, p.completed]));
  const modules = course.modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => ({
    ...lesson, isCompleted: states.get(lesson.id) ?? lesson.isCompleted,
    resources: lesson.resources.map((resource) => ({ ...resource, accessExpiresAt: course.accessExpiresAt })),
  })) }));
  const lessons = modules.flatMap((m) => m.lessons);
  const completedLessons = lessons.filter((l) => l.isCompleted).length;
  return { ...course, modules, totalLessons: lessons.length, completedLessons,
    progressPercentage: lessons.length ? Math.round(completedLessons / lessons.length * 100) : 0 };
}

export const offlineStore = {
  generation,
  resumeUser(user: string) { revoked.delete(user); },
  async revokeUser(user: string): Promise<void> {
    revoked.add(user);
    generations.set(user, generation(user) + 1);
    if (typeof indexedDB !== "undefined") await offlineStore.clearUser(user);
  },
  async get<T>(user: string, kind: Kind, id: string): Promise<T | undefined> {
    return transaction("readonly", (store, result) => {
      const request = store.get(key(user, kind, id));
      request.onsuccess = () => result((request.result as Row<T> | undefined)?.value);
    });
  },
  async put<T>(user: string, kind: Kind, id: string, value: T, revision = generation(user)): Promise<void> {
    if (!writable(user, revision)) return;
    return transaction("readwrite", (store) => { if (writable(user, revision)) store.put({ key: key(user, kind, id), value }); });
  },
  async remove(user: string, kind: Kind, id: string): Promise<void> {
    return transaction("readwrite", (store) => { store.delete(key(user, kind, id)); });
  },
  async list<T>(user: string, kind: Kind): Promise<T[]> {
    return transaction("readonly", (store, result) => {
      const request = store.getAll(range(user, kind));
      request.onsuccess = () => result((request.result as Row<T>[]).map((row) => row.value));
    });
  },
  async clearUser(user: string): Promise<void> {
    return transaction("readwrite", (store) => {
      store.delete(IDBKeyRange.bound([scope, user, ""], [scope, user, "\uffff"]));
    });
  },
  async clearDownloads(user: string): Promise<boolean> {
    return transaction("readwrite", (store, result) => {
      const request = store.count(range(user, "pending"));
      request.onsuccess = () => {
        if (request.result) { result(false); return; }
        store.delete(IDBKeyRange.bound([scope, user, ""], [scope, user, "\uffff"]));
        result(true);
      };
    });
  },
  async removeCourse(user: string, courseId: string): Promise<void> {
    return transaction("readwrite", (store) => {
      const request = store.get(key(user, "course", courseId));
      request.onsuccess = () => {
        const course = (request.result as Row<LearningCourse> | undefined)?.value;
        for (const resource of course?.modules.flatMap((m) => m.lessons.flatMap((l) => l.resources)) ?? []) {
          if (resource.contentPath) store.delete(key(user, "resource", resource.contentPath.replace(/^\/api\/v1/, "")));
        }
        store.delete(key(user, "course", courseId)); store.delete(key(user, "download", courseId));
      };
    });
  },
  async saveCourse(user: string, course: LearningCourse, revision = generation(user)): Promise<LearningCourse> {
    if (!writable(user, revision)) return course;
    return transaction("readwrite", (store, result) => {
      const request = store.getAll(range(user, "pending"));
      request.onsuccess = () => {
        if (!writable(user, revision)) { result(course); return; }
        const updated = withProgress(course, (request.result as Row<PendingProgress>[]).map((row) => row.value));
        store.put({ key: key(user, "course", course.id), value: updated }); result(updated);
      };
    });
  },
  async queueProgress(user: string, courseId: string, lessonId: string, completed: boolean): Promise<LearningCourse> {
    const revision = generation(user);
    if (!writable(user, revision)) throw new DOMException("Session changed", "AbortError");
    return transaction("readwrite", (store, result) => {
      const request = store.get(key(user, "course", courseId));
      request.onsuccess = () => {
        if (!writable(user, revision)) { store.transaction.abort(); return; }
        const course = (request.result as Row<LearningCourse> | undefined)?.value;
        if (!course || !course.modules.some((m) => m.lessons.some((l) => l.id === lessonId))) {
          store.transaction.abort(); return;
        }
        try { assertOfflineAccess(course.accessExpiresAt); } catch { store.transaction.abort(); return; }
        const pending: PendingProgress = { courseId, lessonId, completed, revision: crypto.randomUUID() };
        const updated = withProgress(course, [pending]);
        store.put({ key: key(user, "pending", lessonId), value: pending });
        store.put({ key: key(user, "course", courseId), value: updated }); result(updated);
      };
    });
  },
  async ackProgress(user: string, lessonId: string, revision: string): Promise<void> {
    return transaction("readwrite", (store) => {
      const request = store.get(key(user, "pending", lessonId));
      request.onsuccess = () => {
        if ((request.result as Row<PendingProgress> | undefined)?.value.revision === revision) {
          store.delete(key(user, "pending", lessonId));
        }
      };
    });
  },
  async rejectProgress(user: string, pending: PendingProgress, error: string): Promise<void> {
    return transaction("readwrite", (store) => {
      const request = store.get(key(user, "pending", pending.lessonId));
      request.onsuccess = () => {
        if ((request.result as Row<PendingProgress> | undefined)?.value.revision === pending.revision) {
          store.put({ key: key(user, "pending", pending.lessonId), value: { ...pending, error } });
        }
      };
    });
  },
};
