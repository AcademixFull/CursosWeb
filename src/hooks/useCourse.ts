import { useQuery } from "@tanstack/react-query";
import { getCourse, getRelatedCourses } from "../services/courses.service";
import type { CourseDetail } from "../types/course.types";

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId ?? ""),
    enabled: Boolean(courseId),
  });
}

export function useRelatedCourses(course: CourseDetail | undefined) {
  return useQuery({
    queryKey: ["courses", course?.id, "related"],
    queryFn: () => getRelatedCourses(course as CourseDetail),
    enabled: Boolean(course),
  });
}
