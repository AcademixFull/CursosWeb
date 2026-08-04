import { useQuery } from "@tanstack/react-query";
import { listCourses } from "../services/courses.service";
import type { CourseFilters } from "../types/course.types";

export function useCourses(filters: CourseFilters) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: () => listCourses(filters),
  });
}
