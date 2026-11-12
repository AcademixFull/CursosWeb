import { env } from "../config/env";
import { courseMocks } from "../data/courseMocks";
import { instructorMocks } from "../data/instructorMocks";
import { mergeCourseReviewMocks } from "../data/reviewMocks";
import type { CourseSummary, InstructorDetail } from "../types/course.types";
import { api, type ApiPage } from "./api";

const MOCK_DELAY_MS = 160;

function waitForMocks(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
}

export async function getInstructor(instructorId: string): Promise<InstructorDetail> {
  if (env.dataSource === "api") {
    return api.get<InstructorDetail>(`/instructors/${encodeURIComponent(instructorId)}`);
  }

  await waitForMocks();
  const instructor = instructorMocks.find((item) => item.id === instructorId);
  if (!instructor) throw new Error("No encontramos al instructor solicitado.");

  return {
    ...instructor,
    courseCount: courseMocks.filter((course) => course.instructor.id === instructorId).length,
  };
}

export async function listInstructorCourses(instructorId: string): Promise<CourseSummary[]> {
  if (env.dataSource === "api") {
    return api.get<CourseSummary[]>(
      `/instructors/${encodeURIComponent(instructorId)}/courses`,
    );
  }

  await waitForMocks();
  return courseMocks
    .filter((course) => course.instructor.id === instructorId)
    .map(mergeCourseReviewMocks);
}


export async function listInstructorCoursesPage(instructorId: string, page = 1, signal?: AbortSignal): Promise<ApiPage<CourseSummary>> {
  if (env.dataSource === "api") return api.getPage<CourseSummary>(`/instructors/${encodeURIComponent(instructorId)}/courses`, { params: { page, limit: 10 }, signal });
  const courses = await listInstructorCourses(instructorId);
  return { items: courses.slice((page - 1) * 10, page * 10), pagination: { page, limit: 10, total: courses.length } };
}
