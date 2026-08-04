import { Link } from "react-router";
import { courseDetailRoute } from "../../config/routes";
import type { CourseLevel, CourseSummary } from "../../types/course.types";

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

interface CourseCardProps {
  course: CourseSummary;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/70">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-linear-to-br from-violet-800/50 via-fuchsia-900/25 to-slate-900">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-6 text-center text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
            {course.category.name}
          </span>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
          {course.category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-slate-400">Por {course.instructor.name}</p>
        <h2 className="mt-2 text-lg font-bold leading-6 text-white">{course.title}</h2>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
          {course.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
          <span aria-label={`Valoración ${course.rating} de 5`}>★ {course.rating}</span>
          <span>{course.durationHours} horas</span>
          <span>{levelLabels[course.level]}</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-xl font-extrabold text-violet-400">{formatPrice(course.price)}</span>
          <Link
            to={courseDetailRoute(course.id)}
            className="rounded-lg border border-violet-500/70 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-600 hover:text-white"
          >
            Ver curso
          </Link>
        </div>
      </div>
    </article>
  );
}
