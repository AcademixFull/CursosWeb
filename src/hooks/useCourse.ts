import { useQuery } from "@tanstack/react-query";
import { getCourse, getRelatedCourses } from "../services/courses.service";

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId ?? ""),
    enabled: Boolean(courseId),
  });
}

export function useRelatedCourses(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "related"],
    queryFn: async () => {
      const course = await getCourse(courseId ?? "");
      return getRelatedCourses(course);
    },
    enabled: Boolean(courseId),
  });
}
