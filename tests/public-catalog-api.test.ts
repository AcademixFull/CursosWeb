import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseDetail } from "../src/types/course.types";

function jsonResponse(data: unknown, pagination?: object): Response {
  return new Response(JSON.stringify({ success: true, data, ...(pagination ? { pagination } : {}) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function useApiEnvironment() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
}

describe("public catalog services in API mode", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads active categories from Express", async () => {
    const categories = [{ id: "1", name: "Programación", slug: "programacion" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(categories));
    vi.stubGlobal("fetch", fetchMock);
    await useApiEnvironment();
    const { listCategories } = await import("../src/services/categories.service");

    await expect(listCategories()).resolves.toEqual(categories);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/categories",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends only meaningful catalog filters and preserves pagination", async () => {
    const pagination = { page: 2, limit: 6, total: 0, totalPages: 1 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], pagination));
    vi.stubGlobal("fetch", fetchMock);
    await useApiEnvironment();
    const { listCourses } = await import("../src/services/courses.service");

    await expect(listCourses({
      search: " React ",
      category: "all",
      level: "all",
      page: 2,
      limit: 6,
    })).resolves.toEqual({ items: [], pagination });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/courses?search=React&page=2&limit=6",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads course detail and related courses through their public endpoints", async () => {
    const detail = {
      id: "course-1",
      slug: "react-profesional",
      relatedCourseIds: [],
    } as CourseDetail;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await useApiEnvironment();
    const { getCourse, getRelatedCourses } = await import("../src/services/courses.service");

    await expect(getCourse("react profesional")).resolves.toEqual(detail);
    await expect(getRelatedCourses(detail)).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.academix.test/api/v1/courses/react%20profesional",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.academix.test/api/v1/courses/course-1/related",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads an instructor and their published courses", async () => {
    const instructor = { id: "instructor-1", name: "Ana Pérez" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(instructor))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await useApiEnvironment();
    const { getInstructor, listInstructorCourses } = await import(
      "../src/services/instructors.service"
    );

    await expect(getInstructor("instructor 1")).resolves.toEqual(instructor);
    await expect(listInstructorCourses("instructor 1")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.academix.test/api/v1/instructors/instructor%201",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.academix.test/api/v1/instructors/instructor%201/courses",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads public reviews with their pagination metadata", async () => {
    const reviews = [{
      id: "review-1",
      authorId: "user-1",
      authorName: "Marco",
      rating: 5,
      comment: "Excelente contenido.",
      createdAt: "2026-08-12T12:00:00.000Z",
    }];
    const pagination = { page: 2, limit: 5, total: 6, totalPages: 2 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(reviews, pagination));
    vi.stubGlobal("fetch", fetchMock);
    await useApiEnvironment();
    const { listCourseReviews } = await import("../src/services/reviews.service");

    await expect(listCourseReviews("course 1", 2, 5)).resolves.toEqual({
      items: reviews,
      pagination,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/courses/course%201/reviews?page=2&limit=5",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
