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

it("preserves cached plan prices and has a reference on the first offline visit", async () => {
  vi.stubEnv("VITE_API_URL", "https://plans-qa.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  const connected = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const { subscriptionService } = await import("../src/services/subscription.service");
  const transport = vi.fn().mockResolvedValue(response([{ id: "plus-monthly", priceMxn: 21 }]));
  vi.stubGlobal("fetch", transport);
  expect(await subscriptionService.plans()).toContainEqual(expect.objectContaining({ id: "organizations-monthly", priceMxn: 1000 }));
  connected.mockReturnValue(true);
  await subscriptionService.plans();
  connected.mockReturnValue(false);
  expect(await subscriptionService.plans()).toMatchObject([{ id: "plus-monthly", priceMxn: 21 }]);
  expect(transport).toHaveBeenCalledTimes(1);
});

it("discards subscriptions queued by older builds without sending a purchase", async () => {
  vi.stubEnv("VITE_API_URL", "https://queue-qa.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  const { syncOfflineRequests, listOfflineRequests } = await import("../src/offline/requests");
  const { offlineStore } = await import("../src/offline/store");
  const { saveAuthSession } = await import("../src/utils/authSessionStore");
  saveAuthSession({ user: { id: "owner", fullName: "Owner", email: "owner@test.com", role: "student" },
    accessToken: "test-token", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const key = "plan:plus-monthly:";
  await offlineStore.put("owner", "request", key, { id: key, request: { kind: "plan", input: { planId: "plus-monthly" } } });
  const transport = vi.fn();
  vi.stubGlobal("fetch", transport);
  expect(await listOfflineRequests("owner")).toEqual([]);
  expect(await syncOfflineRequests("owner")).toBe(0);
  expect(transport).not.toHaveBeenCalled();
  expect(await offlineStore.get("owner", "request", key)).toBeUndefined();
});
