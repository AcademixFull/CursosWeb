import { beforeEach, describe, expect, it, vi } from "vitest";

const learningCourse = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "TypeScript",
  instructorName: "Academix",
  progressPercentage: 0,
  completedLessons: 0,
  totalLessons: 1,
  modules: [{
    id: "22222222-2222-4222-8222-222222222222",
    title: "Fundamentos",
    position: 1,
    lessons: [{
      id: "33333333-3333-4333-8333-333333333333",
      title: "Tipos",
      durationMinutes: 12,
      description: "Introducción",
      content: "Contenido real",
      isPreview: false,
      isCompleted: false,
      resources: [{
        id: "44444444-4444-4444-8444-444444444444",
        type: "PDF",
        title: "Guía",
        description: "Lectura",
        required: true,
        position: 1,
        url: null,
        contentPath: "/api/v1/lessons/33333333-3333-4333-8333-333333333333/resources/44444444-4444-4444-8444-444444444444/content",
      }],
    }],
  }],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadService() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return import("../src/services/learning.service");
}

describe("learning service in API mode", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads lesson content and protected resources from the backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: true, data: learningCourse })));
    const { getLearningCourse } = await loadService();

    await expect(getLearningCourse(learningCourse.id)).resolves.toEqual(learningCourse);
  });

  it("persists both completed and pending progress states", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: learningCourse }));
    vi.stubGlobal("fetch", fetchMock);
    const { setLearningLessonProgress } = await loadService();

    await setLearningLessonProgress(learningCourse.id, learningCourse.modules[0].lessons[0].id, false);

    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ completed: false }),
    }));
  });

  it("normalizes backend contentPath without duplicating /api/v1", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("PDF", {
      headers: { "Content-Type": "application/pdf" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { getLearningResourceContent } = await loadService();

    await getLearningResourceContent(learningCourse.modules[0].lessons[0].resources[0]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.academix.test/api/v1/lessons/33333333-3333-4333-8333-333333333333/resources/44444444-4444-4444-8444-444444444444/content",
    );
  });
});
