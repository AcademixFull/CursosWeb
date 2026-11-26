import { offlineStore } from "../offline/store";
import { ApiError } from "./api";
import { withCatalogSnapshot } from "../offline/catalog";
import { env } from "../config/env";
import { courseMocks } from "../data/courseMocks";
import { mergeCourseReviewMocks } from "../data/reviewMocks";
import type {
  CourseDetail,
  CourseFilters,
  CourseListResult,
  CourseSummary,
} from "../types/course.types";
import { api } from "./api";

const MOCK_DELAY_MS = 180;

function waitForMocks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
}

function buildCourseQuery(filters: CourseFilters): string {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.level && filters.level !== "all") params.set("level", filters.level);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 10));

  return params.toString();
}

async function listMockCourses(filters: CourseFilters): Promise<CourseListResult> {
  await waitForMocks();

  const normalizedSearch = filters.search?.trim().toLocaleLowerCase("es") ?? "";
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  const filtered = courseMocks.map(mergeCourseReviewMocks).filter((course) => {
    const matchesSearch =
      !normalizedSearch ||
      [course.title, course.shortDescription, course.instructor.name, course.category.name]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(normalizedSearch);
    const matchesCategory =
      !filters.category || filters.category === "all" || course.category.slug === filters.category;
    const matchesLevel = !filters.level || filters.level === "all" || course.level === filters.level;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  };
}

async function listApiCourses(filters: CourseFilters, signal?: AbortSignal): Promise<CourseListResult> {
  const page = await api.getPage<CourseSummary>(`/courses?${buildCourseQuery(filters)}`, { signal });

  return {
    items: page.items,
    pagination: {
      ...page.pagination,
      totalPages: page.pagination.totalPages ?? Math.max(1, Math.ceil(page.pagination.total / page.pagination.limit)),
    },
  };
}

export async function listCourses(filters: CourseFilters = {}, signal?: AbortSignal): Promise<CourseListResult> {
  if (env.dataSource !== "api") return listMockCourses(filters);
  if (buildCourseQuery(filters) === "page=1&limit=10") {
    return withCatalogSnapshot("first", () => listApiCourses(filters, signal), signal);
  }
  return listApiCourses(filters, signal);
}

export async function listFeaturedCourses(signal?: AbortSignal): Promise<CourseSummary[]> {
  if (env.dataSource === "api") {
    return withCatalogSnapshot("featured", () => api.get<CourseSummary[]>("/courses/featured", { signal }), signal);
  }

  await waitForMocks();
  return courseMocks.slice(0, 5).map(mergeCourseReviewMocks);
}

export async function getCourse(courseId: string, signal?: AbortSignal): Promise<CourseDetail> {
  if (env.dataSource === "api") {
    try {
      if (!navigator.onLine) throw new ApiError("Curso sin conexión", { status: 0, code: "NETWORK_ERROR" });
      return await api.get<CourseDetail>(`/courses/${encodeURIComponent(courseId)}`, { signal });
    } catch (error) {
      signal?.throwIfAborted();
      if (!(error instanceof ApiError) || (error.code !== "NETWORK_ERROR" && ![502, 503, 504].includes(error.status))) throw error;
      const first = await offlineStore.get<CourseListResult>("public", "catalog", "first").catch(() => undefined);
      const featured = await offlineStore.get<CourseSummary[]>("public", "catalog", "featured").catch(() => undefined);
      const saved = [...(first?.items ?? []), ...(featured ?? [])].find((item) => item.id === courseId || item.slug === courseId);
      if (!saved) throw error;
      return { ...saved, savedPreview: true, description: saved.shortDescription,
        learningOutcomes: [], requirements: [], language: "", modules: [], reviews: [], relatedCourseIds: [] };
    }
  }

  await waitForMocks();
  const course = courseMocks.find((item) => item.id === courseId || item.slug === courseId);

  if (!course) {
    throw new Error("No encontramos el curso solicitado.");
  }

  return mergeCourseReviewMocks(course);
}

export async function getRelatedCourses(course: CourseDetail, signal?: AbortSignal): Promise<CourseSummary[]> {
  if (env.dataSource === "api") {
    return api.get<CourseSummary[]>(`/courses/${encodeURIComponent(course.id)}/related`, { signal });
  }

  await waitForMocks();
  return course.relatedCourseIds
    .map((courseId) => courseMocks.find((item) => item.id === courseId))
    .filter((item): item is CourseDetail => Boolean(item))
    .map(mergeCourseReviewMocks);
}
