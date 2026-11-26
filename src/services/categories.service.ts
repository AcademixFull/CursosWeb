import { withCatalogSnapshot } from "../offline/catalog";
import { env } from "../config/env";
import { courseCategories } from "../data/courseMocks";
import type { CourseCategory } from "../types/course.types";
import { api } from "./api";

const MOCK_DELAY_MS = 120;

export async function listCategories(): Promise<CourseCategory[]> {
  if (env.dataSource === "api") {
    return withCatalogSnapshot("categories", () => api.get<CourseCategory[]>("/categories"));
  }

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  return courseCategories;
}
