import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { courseMocks } from "../src/data/courseMocks";

async function loadMockService() {
  vi.stubEnv("VITE_DATA_SOURCE", "mock");
  vi.resetModules();
  return import("../src/services/courses.service");
}

describe("courses service in mock mode", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("paginates the catalog", async () => {
    const { listCourses } = await loadMockService();
    const result = await listCourses({ page: 2, limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: courseMocks.length,
      totalPages: Math.ceil(courseMocks.length / 2),
    });
  });

  it("combines search, category and level filters", async () => {
    const { listCourses } = await loadMockService();
    const targetCourse = courseMocks[0];
    if (!targetCourse) throw new Error("Los mocks de cursos están vacíos.");

    const result = await listCourses({
      search: targetCourse.title,
      category: targetCourse.category.slug,
      level: targetCourse.level,
    });

    expect(result.items.map((course) => course.id)).toContain(targetCourse.id);
  });

  it("returns a course by id or slug", async () => {
    const { getCourse } = await loadMockService();
    const targetCourse = courseMocks[0];
    if (!targetCourse) throw new Error("Los mocks de cursos están vacíos.");

    await expect(getCourse(targetCourse.id)).resolves.toMatchObject({ id: targetCourse.id });
    await expect(getCourse(targetCourse.slug)).resolves.toMatchObject({ id: targetCourse.id });
  });

  it("rejects an unknown course", async () => {
    const { getCourse } = await loadMockService();
    await expect(getCourse("curso-inexistente")).rejects.toThrow(
      "No encontramos el curso solicitado.",
    );
  });
  it("limits featured mocks to five courses", async () => {
    const { listFeaturedCourses } = await loadMockService();
    const result = await listFeaturedCourses();

    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.map((course) => course.id)).toEqual(courseMocks.slice(0, 5).map((course) => course.id));
  });

});
