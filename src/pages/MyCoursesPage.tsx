import { useState } from "react";
import { EnrollmentCard } from "../components/student/EnrollmentCard";
import { StudentPageHeader } from "../components/student/StudentPageHeader";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "../config/routes";
import { useMyCourses } from "../hooks/useStudent";
import type { EnrollmentStatus } from "../types/student.types";
import { classNames } from "../utils/classNames";

type CourseView = "all" | EnrollmentStatus;

const views: Array<{ value: CourseView; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completados" },
];

export default function MyCoursesPage() {
  const [view, setView] = useState<CourseView>("all");
  const query = useMyCourses();

  if (query.isLoading) return <PageLoader label="Cargando tus cursos" />;
  if (query.isError) {
    return <ErrorState description="No pudimos cargar tus cursos." onRetry={() => void query.refetch()} />;
  }

  const courses = query.data ?? [];
  const visibleCourses = view === "all" ? courses : courses.filter((item) => item.status === view);

  return (
    <div>
      <StudentPageHeader
        eyebrow="Biblioteca personal"
        title="Mis cursos"
        description="Consulta tus cursos activos, revisa los completados y continúa con la siguiente lección."
        action={<ButtonLink to={ROUTES.courses}>Explorar catálogo</ButtonLink>}
      />

      <div className="mt-8 flex flex-wrap gap-2" aria-label="Filtrar mis cursos">
        {views.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={view === item.value}
            onClick={() => setView(item.value)}
            className={classNames(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              view === item.value
                ? "bg-brand-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-brand-500 hover:text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visibleCourses.length ? (
        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState title="No hay cursos en esta sección" description="Cambia el filtro o explora nuevos cursos en el catálogo." />
        </div>
      )}
    </div>
  );
}
