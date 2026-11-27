import { ApiError } from "../services/api";
import { enrollInCourse } from "../services/enrollments.service";
import { canSync } from "./learning";
import { offlineStore } from "./store";

type EnrollmentRequest = { kind: "enrollment"; courseId: string };
type Entry = { id: string; request: EnrollmentRequest | { kind: "plan" }; error?: string };

const transient = (error: unknown) => error instanceof ApiError &&
  (error.code === "NETWORK_ERROR" || [502, 503, 504].includes(error.status));

export async function listOfflineRequests(user: string) {
  return (await offlineStore.list<Entry>(user, "request"))
    .filter((entry) => entry.request.kind === "enrollment");
}

const running = new Map<string, Promise<unknown>>();
function serialize<T>(user: string, action: () => Promise<T>): Promise<T> {
  const previous = running.get(user);
  const run = () => navigator.locks ? navigator.locks.request(`academix-requests:${user}`, action) : action();
  const promise = (previous ? previous.catch(() => undefined).then(run) : run()).finally(() => {
    if (running.get(user) === promise) running.delete(user);
  });
  running.set(user, promise);
  return promise;
}

export function submitOfflineRequest<T>(user: string, request: EnrollmentRequest, send: () => Promise<T>) {
  const revision = offlineStore.generation(user);
  const id = `course:${request.courseId}`;
  return serialize(user, async () => {
    const ensureAccount = () => {
      if (offlineStore.generation(user) !== revision) throw new DOMException("Session changed", "AbortError");
    };
    ensureAccount();
    const existing = await offlineStore.get<Entry>(user, "request", id).catch(() => undefined);
    ensureAccount();
    if (existing && !existing.error) return { queued: true as const };
    if (navigator.onLine) {
      try {
        const result = await send();
        ensureAccount();
        if (existing) await offlineStore.remove(user, "request", id);
        return { queued: false as const, result };
      } catch (error) {
        if (!transient(error)) throw error;
      }
    }
    ensureAccount();
    const entries = await listOfflineRequests(user);
    if (!existing && entries.length >= 20) throw new Error("Hay demasiadas solicitudes guardadas.");
    ensureAccount();
    await offlineStore.put(user, "request", id, { id, request }, revision);
    ensureAccount();
    return { queued: true as const };
  });
}

export function syncOfflineRequests(user: string) {
  const revision = offlineStore.generation(user);
  const active = () => canSync(user) && offlineStore.generation(user) === revision;
  return serialize(user, async () => {
    let confirmed = 0;
    for (const entry of await offlineStore.list<Entry>(user, "request")) {
      if (!active()) break;
      if (entry.request.kind === "plan") {
        await offlineStore.remove(user, "request", entry.id);
        continue;
      }
      if (entry.error) continue;
      try {
        await enrollInCourse(entry.request.courseId);
        if (!active()) break;
        await offlineStore.remove(user, "request", entry.id);
        confirmed++;
      } catch (error) {
        if (!active() || transient(error) || !(error instanceof ApiError)) break;
        if (error.code === "ENROLLMENT_ALREADY_EXISTS") {
          await offlineStore.remove(user, "request", entry.id);
          confirmed++;
        } else if ([400, 403, 404, 409, 422].includes(error.status)) {
          await offlineStore.put(user, "request", entry.id, { ...entry, error: error.message }, revision);
        }
      }
    }
    return confirmed;
  });
}
