import type { CourseSummary } from "../../types/course.types";
import CourseCard from "./CourseCard";

interface CourseGridProps {
  courses: CourseSummary[];
}

export default function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
