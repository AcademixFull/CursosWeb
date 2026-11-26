import { ApiError } from "../services/api";
import { enrollInCourse } from "../services/enrollments.service";
import { subscriptionService } from "../services/subscription.service";
import { canSync } from "./learning";
import { offlineStore } from "./store";

type PlanInput = Parameters<typeof subscriptionService.purchase>[0];
type Request = { kind: "enrollment"; courseId: string } | { kind: "plan"; input: PlanInput };
type Entry = { id: string; request: Request; error?: string };

const transient = (error: unknown) => error instanceof ApiError &&
  (error.code === "NETWORK_ERROR" || [502, 503, 504].includes(error.status));

export const listOfflineRequests = (user: string) => offlineStore.list<Entry>(user, "request");

function execute(request: Request) {
  return request.kind === "enrollment"
    ? enrollInCourse(request.courseId)
    : subscriptionService.purchase(request.input);
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

export function submitOfflineRequest<T>(user: string, request: Request, send: () => Promise<T>) {
  const revision = offlineStore.generation(user);
  const id = request.kind === "enrollment" ? `course:${request.courseId}`
    : `plan:${request.input.planId}:${request.input.organizationId ?? ""}`;
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
    for (const entry of await listOfflineRequests(user)) {
      if (!active()) break;
      if (entry.error) continue;
      try {
        await execute(entry.request);
        if (!active()) break;
        await offlineStore.remove(user, "request", entry.id);
        confirmed++;
      } catch (error) {
        if (!active() || transient(error) || !(error instanceof ApiError)) break;
        if (error.code === "ENROLLMENT_ALREADY_EXISTS" && entry.request.kind === "enrollment") {
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
