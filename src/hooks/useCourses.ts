import { useQuery } from "@tanstack/react-query";
import { listCourses, listFeaturedCourses } from "../services/courses.service";
import type { CourseFilters } from "../types/course.types";

export function useCourses(filters: CourseFilters) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: () => listCourses(filters),
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ["courses", "featured"],
    queryFn: listFeaturedCourses,
  });
}
