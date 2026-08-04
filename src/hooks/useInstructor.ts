import { useQuery } from "@tanstack/react-query";
import { getInstructor, listInstructorCourses } from "../services/instructors.service";

export function useInstructor(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor", instructorId],
    queryFn: () => getInstructor(instructorId ?? ""),
    enabled: Boolean(instructorId),
  });
}

export function useInstructorCourses(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor", instructorId, "courses"],
    queryFn: () => listInstructorCourses(instructorId ?? ""),
    enabled: Boolean(instructorId),
  });
}
