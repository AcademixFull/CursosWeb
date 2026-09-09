import { Link, useLocation, useNavigate } from "react-router";
import { courseDetailRoute, instructorRoute, ROUTES } from "../../config/routes";
import type { CourseLevel, CourseSummary } from "../../types/course.types";
import { Badge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { formatMxn } from "../../utils/currency";
import { locationPath } from "../../utils/navigation";

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

interface CourseCardProps {
  course: CourseSummary;
}

export default function CourseCard({ course }: CourseCardProps) {
  const cart = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const ownsCourse = isAuthenticated && cart.ownsCourse(course.id);
  const ownershipPending = isAuthenticated && !cart.ownershipReady;

  function addToCart() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { returnTo: locationPath(location) } });
      return;
    }
    cart.addCourse(course);
  }

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

        <div className="mt-auto flex flex-col items-stretch gap-3 border-t border-white/10 pt-5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <span className="text-xl font-extrabold text-violet-400">{formatMxn(course.price)}</span>
          <div className="flex flex-wrap gap-2 min-[420px]:justify-end">
            {course.price > 0 ? (
              <Button
                type="button"
                variant={ownershipPending || ownsCourse || (isAuthenticated && cart.hasCourse(course.id)) ? "ghost" : "secondary"}
                size="sm"
                disabled={ownershipPending || ownsCourse || (isAuthenticated && cart.hasCourse(course.id))}
                onClick={addToCart}
              >
                {!isAuthenticated
                  ? "Entrar para agregar"
                  : ownershipPending
                    ? "Consultando..."
                    : ownsCourse
                      ? "Ya lo tienes"
                      : cart.hasCourse(course.id)
                        ? "En carrito"
                        : "Agregar"}
              </Button>
            ) : null}
            <ButtonLink to={courseDetailRoute(course.id)} variant="secondary" size="sm">Ver curso</ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
