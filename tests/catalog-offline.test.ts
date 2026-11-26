import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

const response = (data: unknown, pagination?: object) => new Response(
  JSON.stringify({ success: true, data, pagination }),
  { headers: { "Content-Type": "application/json" } },
);

it("reopens the last successful catalog and highlights after a fresh app load offline", async () => {
  vi.stubEnv("VITE_API_URL", "https://snapshot-qa.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  const connected = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  const transport = vi.fn()
    .mockResolvedValueOnce(response([{ id: "old" }]))
    .mockResolvedValueOnce(response([{ id: "latest", slug: "latest", shortDescription: "Guardado" }]))
    .mockResolvedValueOnce(response([{ id: "first" }], { page: 1, limit: 10, total: 15 }));
  vi.stubGlobal("fetch", transport);
  const service = await import("../src/services/courses.service");
  await service.listFeaturedCourses();
  await service.listFeaturedCourses();
  await service.listCourses();
  connected.mockReturnValue(false);
  vi.resetModules();
  const reloaded = await import("../src/services/courses.service");
  expect(await reloaded.listFeaturedCourses()).toMatchObject([{ id: "latest" }]);
  expect(await reloaded.listCourses()).toMatchObject({ items: [{ id: "first" }] });
  expect(await reloaded.getCourse("latest")).toMatchObject({ id: "latest", savedPreview: true });
  expect(transport).toHaveBeenCalledTimes(3);
});

it("sends a queued subscription once with its original key and never from another account", async () => {
  vi.stubEnv("VITE_API_URL", "https://queue-qa.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  const connected = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const { submitOfflineRequest, syncOfflineRequests, listOfflineRequests } = await import("../src/offline/requests");
  const { saveAuthSession } = await import("../src/utils/authSessionStore");
  function signIn(id: string) {
    saveAuthSession({ user: { id, fullName: id, email: `${id}@test.com`, role: "student" },
      accessToken: "test-token", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  }
  signIn("owner");
  const send = vi.fn();
  const input = { planId: "plus-monthly", idempotencyKey: "stable-key" };
  expect(await submitOfflineRequest("owner", { kind: "plan", input }, send)).toEqual({ queued: true });
  expect(send).not.toHaveBeenCalled();
  const transport = vi.fn().mockResolvedValue(response({ id: "receipt" }));
  vi.stubGlobal("fetch", transport);
  connected.mockReturnValue(true);
  signIn("somebody-else");
  expect(await syncOfflineRequests("owner")).toBe(0);
  expect(transport).not.toHaveBeenCalled();
  signIn("owner");
  expect(await syncOfflineRequests("owner")).toBe(1);
  expect(await syncOfflineRequests("owner")).toBe(0);
  expect(transport).toHaveBeenCalledTimes(1);
  expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual(input);
  expect(await listOfflineRequests("owner")).toEqual([]);
});
