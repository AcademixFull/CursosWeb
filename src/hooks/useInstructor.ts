import { useQuery } from "@tanstack/react-query";
import { getInstructor, listInstructorCoursesPage } from "../services/instructors.service";

export function useInstructor(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor", instructorId],
    queryFn: () => getInstructor(instructorId ?? ""),
    enabled: Boolean(instructorId),
  });
}

export function useInstructorCourses(instructorId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ["instructor", instructorId, "courses", page],
    queryFn: ({ signal }) => listInstructorCoursesPage(instructorId ?? "", page, signal),
    enabled: Boolean(instructorId),
  });
}
