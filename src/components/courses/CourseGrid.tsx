import type { CourseSummary } from "../../types/course.types";
import CourseCard from "./CourseCard";
import { useCourseOwnership } from "../../hooks/useStudent";
import { useAuth } from "../../hooks/useAuth";

interface CourseGridProps {
  courses: CourseSummary[];
}

export default function CourseGrid({ courses }: CourseGridProps) {
  const { user } = useAuth();
  const ownership = useCourseOwnership(courses.map((course) => course.id));
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} ownership={{ owned: ownership.data?.includes(course.id) ?? false, ready: !user || ownership.isSuccess }} />
      ))}
    </div>
  );
}
