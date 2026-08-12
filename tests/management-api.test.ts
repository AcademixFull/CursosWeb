import { beforeEach, describe, expect, it, vi } from "vitest";

function response(data: unknown, pagination?: object) {
  return new Response(JSON.stringify({ success: true, data, ...(pagination ? { pagination } : {}) }), { headers: { "Content-Type": "application/json" } });
}

async function loadService() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return (await import("../src/services/management.service")).managementService;
}

describe("management services", () => {
  beforeEach(() => { sessionStorage.clear(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("loads paginated users with admin filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([], { page: 1, limit: 50, total: 0, totalPages: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();
    await service.listUsers({ search: "Marco", role: "admin", limit: 50 });
    expect(fetchMock).toHaveBeenCalledWith("https://api.academix.test/api/v1/admin/users?search=Marco&role=admin&limit=50", expect.objectContaining({ method: "GET" }));
  });

  it("updates roles and assigns an instructor using backend-only endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ id: "entity-1" })));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();
    await service.setUserRoles("user-1", ["instructor"]);
    await service.assignInstructor("course-1", "user-1");
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://api.academix.test/api/v1/admin/users/user-1/roles", expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.academix.test/api/v1/admin/courses/course-1/instructor", expect.objectContaining({ method: "PUT" }));
  });

  it("submits instructor courses and loads authoring content", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ id: "course-1" })).mockResolvedValueOnce(response({ courseId: "course-1", status: "review", modules: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();
    await service.submitInstructorCourse("course-1");
    await service.getCourseContent("course-1");
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://api.academix.test/api/v1/instructor/courses/course-1/submit", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://api.academix.test/api/v1/authoring/courses/course-1/content", expect.objectContaining({ method: "GET" }));
  });

  it("rejects files larger than the backend limit before uploading", async () => {
    const service = await loadService();
    const file = new File([new Uint8Array(25 * 1024 * 1024 + 1)], "large.bin");
    expect(() => service.uploadCourseFile("course-1", file)).toThrow("25 MB");
  });
});
