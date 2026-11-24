import { env } from "../config/env";
import { useQuery } from "@tanstack/react-query";
import { listCourses, listFeaturedCourses } from "../services/courses.service";
import type { CourseFilters } from "../types/course.types";

export function useCourses(filters: CourseFilters) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: ({ signal }) => listCourses(filters, signal),
    staleTime: env.cache.catalogTtlMs,
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ["courses", "featured"],
    queryFn: ({ signal }) => listFeaturedCourses(signal),
    staleTime: env.cache.featuredTtlMs,
  });
}
