import { Link } from "react-router";
import { courseDetailRoute, instructorRoute } from "../../config/routes";
import type { CourseLevel, CourseSummary } from "../../types/course.types";
import { Badge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { useCart } from "../../hooks/useCart";

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
  const cart = useCart();
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/70">
      <div className="academix-soft-banner relative flex aspect-video items-center justify-center overflow-hidden">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="academix-soft-banner-text px-6 text-center text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
            {course.category.name}
          </span>
        )}
        <Badge className="academix-brand-badge absolute left-4 top-4 bg-brand-700/90 text-white">
          {course.category.name}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-slate-400">
          Por{" "}
          <Link
            to={instructorRoute(course.instructor.id)}
            className="font-semibold text-violet-300 transition hover:text-violet-200 hover:underline"
          >
            {course.instructor.name}
          </Link>
        </p>
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
          <div className="flex gap-2">
            {course.price > 0 ? <Button type="button" variant={cart.hasCourse(course.id) ? "ghost" : "secondary"} size="sm" disabled={cart.hasCourse(course.id)} onClick={() => cart.addCourse(course)}>{cart.hasCourse(course.id) ? "En carrito" : "Agregar"}</Button> : null}
            <ButtonLink to={courseDetailRoute(course.id)} variant="secondary" size="sm">Ver curso</ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
