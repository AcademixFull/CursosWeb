import { beforeEach, describe, expect, it, vi } from "vitest";

function response(data: unknown, pagination?: object) {
  return new Response(
    JSON.stringify({ success: true, data, ...(pagination ? { pagination } : {}) }),
    { headers: { "Content-Type": "application/json" } },
  );
}

async function loadService() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return (await import("../src/services/moderation.service")).moderationService;
}

describe("moderation service", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("lista cursos con filtros de moderación", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response([], { page: 2, limit: 12, total: 0, totalPages: 1 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.listCourses({ search: "React", status: "published", page: 2, limit: 12 });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/moderation/courses?search=React&status=published&page=2&limit=12",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("carga el contenido completo y el historial de un curso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({ course: { id: "course-1" }, content: { modules: [] }, moderationHistory: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.getCourse("course-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/moderation/courses/course-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("da de baja con un motivo obligatorio enviado al backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ course: { id: "course-1" } }));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.takeDown("course-1", "Contenido que incumple los lineamientos.");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/moderation/courses/course-1/takedown",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Contenido que incumple los lineamientos." }),
      }),
    );
  });

  it("permite solicitar la restauración desde el panel de moderación", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ course: { id: "course-1" } }));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.restore("course-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/moderation/courses/course-1/restore",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
