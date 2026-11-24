import { useQuery } from "@tanstack/react-query";
import { getCourse, getRelatedCourses } from "../services/courses.service";
import type { CourseDetail } from "../types/course.types";

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: ({ signal }) => getCourse(courseId ?? "", signal),
    enabled: Boolean(courseId),
  });
}

export function useRelatedCourses(course: CourseDetail | undefined) {
  return useQuery({
    queryKey: ["courses", course?.id, "related"],
    queryFn: ({ signal }) => getRelatedCourses(course as CourseDetail, signal),
    enabled: Boolean(course),
  });
}
