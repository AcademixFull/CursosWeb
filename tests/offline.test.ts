import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningCourse } from "../src/types/learning.types";

const course: LearningCourse = {
  accessExpiresAt: null,
  id: "course", title: "Curso offline", instructorName: "Academix",
  progressPercentage: 0, completedLessons: 0, totalLessons: 1,
  modules: [{ id: "module", title: "Inicio", position: 1, lessons: [{
    id: "lesson", title: "Lección", description: "", content: "Aprender sin internet",
    durationMinutes: 10, isPreview: false, isCompleted: false, resources: [],
  }] }],
};

async function setup(userId = "alice") {
  vi.stubEnv("VITE_API_URL", "https://offline.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  const auth = await import("../src/utils/authSessionStore");
  auth.saveAuthSession({ user: { id: userId, email: `${userId}@test.com`, fullName: userId, role: "student" },
    accessToken: "jwt", expiresAt: new Date(Date.now() + 60000).toISOString() });
  const { offlineStore } = await import("../src/offline/store");
  await offlineStore.clearUser(userId);
  return { auth, offlineStore, service: await import("../src/offline/learning") };
}

describe("offline learning", () => {
  it("stops reading subscription snapshots at the server deadline while keeping individual purchases", async () => {
    const { offlineStore, service } = await setup("expiry-test");
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    try {
      await offlineStore.put("expiry-test", "course", course.id, { ...course, accessExpiresAt: new Date(now + 1000).toISOString() });
      expect(await service.loadOfflineCourse("expiry-test", course.id)).toMatchObject({ id: course.id });
      clock.mockReturnValue(now + 1000);
      await expect(service.loadOfflineCourse("expiry-test", course.id)).rejects.toThrow("venció");
      await offlineStore.put("expiry-test", "course", course.id, { ...course, accessExpiresAt: null });
      expect(await service.loadOfflineCourse("expiry-test", course.id)).toMatchObject({ id: course.id });
    } finally { clock.mockRestore(); await offlineStore.clearUser("expiry-test"); }
  });
  it("requires reconnecting legacy downloads that lack a server access deadline", async () => {
    const { offlineStore, service } = await setup("legacy-expiry");
    await offlineStore.put("legacy-expiry", "course", course.id, { ...course, accessExpiresAt: undefined });
    await expect(service.loadOfflineCourse("legacy-expiry", course.id)).rejects.toThrow("verificar la vigencia");
    await offlineStore.clearUser("legacy-expiry");
  });
  it("blocks expired cached protected files while retaining queued progress", async () => {
    const { offlineStore, service } = await setup("resource-expiry");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const resource = { id: "file", title: "PDF", type: "PDF", description: "", required: true,
      position: 1, url: null, contentPath: "/api/v1/lessons/lesson/resources/file/content" };
    await offlineStore.put("resource-expiry", "resource", "/lessons/lesson/resources/file/content", {
      blob: new Blob(["protected"]), contentType: "text/plain", accessExpiresAt: new Date(Date.now() - 1).toISOString(),
    });
    await offlineStore.put("resource-expiry", "pending", "lesson", { revision: "pending" });
    await expect(service.loadResourceWithOffline("resource-expiry", resource)).rejects.toThrow("venció");
    expect(await offlineStore.list("resource-expiry", "pending")).toHaveLength(1);
    await offlineStore.clearUser("resource-expiry");
  });
  beforeEach(() => {
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
    sessionStorage.clear(); localStorage.clear();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  it("reopens downloaded lessons after a module reload without network", async () => {
    const { offlineStore } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.resetModules();
    const { loadOfflineCourse } = await import("../src/offline/learning");
    expect(await loadOfflineCourse("alice", course.id)).toEqual(course);
  });

  it("keeps accounts and backend environments separate", async () => {
    const { offlineStore } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    expect(await offlineStore.get("bob", "course", course.id)).toBeUndefined();
    vi.stubEnv("VITE_API_URL", "https://other.test/api/v1"); vi.resetModules();
    const other = await import("../src/offline/store");
    expect(await other.offlineStore.get("alice", "course", course.id)).toBeUndefined();
  });

  it("persists offline progress and keeps the latest toggle through replay", async () => {
    const { offlineStore, service } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    expect((await service.saveOfflineProgress("alice", course.id, "lesson", true)).progressPercentage).toBe(100);
    await service.saveOfflineProgress("alice", course.id, "lesson", false);
    const queued = await offlineStore.list<{ completed: boolean }>("alice", "pending");
    expect(queued).toHaveLength(1); expect(queued[0].completed).toBe(false);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await service.syncOfflineProgress("alice");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ completed: false });
    expect(await offlineStore.list("alice", "pending")).toEqual([]);
  });

  it("does not acknowledge a newer edit while an older edit is in flight", async () => {
    const { offlineStore, service } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await service.saveOfflineProgress("alice", course.id, "lesson", true);
    const [old] = await offlineStore.list<{ lessonId: string; revision: string }>("alice", "pending");
    await service.saveOfflineProgress("alice", course.id, "lesson", false);
    await offlineStore.ackProgress("alice", old.lessonId, old.revision);
    expect(await offlineStore.list("alice", "pending")).toHaveLength(1);
  });

  it("keeps pending work on failed sync and never syncs another account", async () => {
    const { offlineStore, service, auth } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await service.saveOfflineProgress("alice", course.id, "lesson", true);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(service.syncOfflineProgress("alice")).rejects.toBeDefined();
    expect(await offlineStore.list("alice", "pending")).toHaveLength(1);
    auth.saveAuthSession({ user: { id: "bob", email: "bob@test.com", fullName: "Bob", role: "student" },
      accessToken: "bob-jwt", expiresAt: new Date(Date.now() + 60000).toISOString() });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await service.syncOfflineProgress("alice");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not serve cached content when the server revokes access", async () => {
    const { offlineStore } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false, error: { code: "ENROLLMENT_REQUIRED", message: "Acceso revocado." },
    }), { status: 403, headers: { "Content-Type": "application/json" } })));
    const { getLearningCourse } = await import("../src/services/learning.service");
    await expect(getLearningCourse(course.id)).rejects.toMatchObject({ status: 403 });
  });

  it("retains only an offline profile across browser restarts", async () => {
    await setup();
    expect(localStorage.getItem("academix.offline-profile.v1")).not.toContain("jwt");
    sessionStorage.clear();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.resetModules();
    const reloaded = await import("../src/utils/authSessionStore");
    expect(reloaded.readAuthSession()?.user.id).toBe("alice");
    expect(reloaded.getAuthToken()).toBeUndefined();
    reloaded.clearAuthSession();
    expect(reloaded.readAuthSession()).toBeNull();
  });

  it("downloads protected files, reports external links and retries missing files", async () => {
    const { offlineStore } = await setup();
    const protectedResource = { id: "file", title: "PDF", type: "PDF", description: "", required: true,
      position: 1, url: null, contentPath: "/api/v1/lessons/lesson/resources/file/content" };
    const withResources = structuredClone(course);
    withResources.modules[0].lessons[0].resources = [protectedResource,
      { ...protectedResource, id: "external", contentPath: null, url: "https://youtube.com/watch?v=test" }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: withResources })))
      .mockRejectedValueOnce(new TypeError("lost connection"));
    vi.stubGlobal("fetch", fetchMock);
    const { downloadCourse } = await import("../src/offline/downloads");
    await expect(downloadCourse("alice", course.id)).rejects.toBeDefined();
    expect(await offlineStore.get("alice", "download", course.id)).toMatchObject({ status: "error" });
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: withResources })))
      .mockResolvedValueOnce(new Response("PDF", { headers: { "Content-Type": "application/pdf" } }));
    const state = await downloadCourse("alice", course.id);
    expect(state).toMatchObject({ status: "partial", savedFiles: 1, totalFiles: 1, externalResources: 1 });
    const file = await offlineStore.get<{ contentType: string }>("alice", "resource", "/lessons/lesson/resources/file/content");
    expect(file?.contentType).toBe("application/pdf");
  });

  it("continues replay after a deleted lesson and retains rejected edits for review", async () => {
    const { offlineStore, service } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    await service.saveOfflineProgress("alice", course.id, "lesson", true);
    await offlineStore.put("alice", "pending", "lesson2", {courseId: "other", lessonId: "lesson2", completed: true, revision: "r2"});
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({success:false,error:{code:"LESSON_NOT_FOUND",message:"Lección eliminada."}}),{status:404}))
      .mockResolvedValueOnce(new Response(null,{status:204}));
    vi.stubGlobal("fetch", fetchMock);
    expect(await service.syncOfflineProgress("alice")).toBe(1);
    expect(await offlineStore.list("alice", "pending")).toEqual([expect.objectContaining({lessonId:"lesson", error:expect.any(String)})]);
  });

  it("refuses to erase downloads containing unsent edits", async () => {
    const { offlineStore, service } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    await service.saveOfflineProgress("alice", course.id, "lesson", true);
    expect(await offlineStore.clearDownloads("alice")).toBe(false);
    expect(await offlineStore.list("alice", "pending")).toHaveLength(1);
    expect(await offlineStore.get("alice", "course", course.id)).toEqual(expect.objectContaining({progressPercentage:100}));
  });

  it("keeps a tab's offline identity stable when another tab logs in", async () => {
    await setup();
    sessionStorage.clear(); vi.spyOn(navigator,"onLine","get").mockReturnValue(false); vi.resetModules();
    const auth = await import("../src/utils/authSessionStore");
    expect(auth.readAuthSession()?.user.id).toBe("alice");
    const profile = JSON.parse(localStorage.getItem("academix.offline-profile.v1")!);
    localStorage.setItem("academix.offline-profile.v1", JSON.stringify({...profile,user:{...profile.user,id:"bob"}}));
    expect(auth.readAuthSession()?.user.id).toBe("alice");
  });

  it("purges content after confirmed access revocation but preserves unsent edits", async () => {
    const { offlineStore, service } = await setup();
    await offlineStore.put("alice", "course", course.id, course);
    await service.saveOfflineProgress("alice", course.id, "lesson", true);
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({success:false,error:{code:"ENROLLMENT_REQUIRED",message:"Sin acceso."}}),{status:403})));
    const { getLearningCourse } = await import("../src/services/learning.service");
    await expect(getLearningCourse(course.id)).rejects.toMatchObject({status:403});
    expect(await offlineStore.get("alice","course",course.id)).toBeUndefined();
    expect(await offlineStore.list("alice","pending")).toHaveLength(1);
  });

  it("removes a protected file after the server revokes access to that file", async () => {
    const { offlineStore } = await setup();
    const path = "/lessons/lesson/resources/file/content";
    await offlineStore.put("alice", "resource", path, {blob:new Blob(["private"]),contentType:"text/plain"});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({success:false,error:{code:"ENROLLMENT_REQUIRED",message:"Sin acceso."}}),{status:403})));
    const { loadResourceWithOffline } = await import("../src/offline/learning");
    await expect(loadResourceWithOffline("alice", {id:"file",type:"PDF",title:"Guía",description:"",required:true,position:1,url:null,contentPath:`/api/v1${path}`})).rejects.toMatchObject({status:403});
    expect(await offlineStore.get("alice", "resource", path)).toBeUndefined();
  });
});
