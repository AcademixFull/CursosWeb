import { learningRoute } from "../../config/routes";
import type { EnrollmentSummary } from "../../types/student.types";
import { Badge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { ProgressBar } from "./ProgressBar";

interface EnrollmentCardProps {
  enrollment: EnrollmentSummary;
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const { course } = enrollment;
  const isCompleted = enrollment.status === "completed";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-xl shadow-black/20">
      <div className="flex min-h-32 items-end bg-linear-to-br from-brand-900/70 via-slate-900 to-cyan-950 p-5">
        <Badge tone={isCompleted ? "success" : "brand"}>
          {isCompleted ? "Completado" : course.category.name}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-slate-500">Por {course.instructor.name}</p>
        <h2 className="mt-2 text-lg font-bold leading-6 text-white">{course.title}</h2>
        <div className="mt-5">
          <ProgressBar value={enrollment.progressPercentage} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {enrollment.completedLessons} de {enrollment.totalLessons} lecciones completadas
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Último acceso: {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
            new Date(enrollment.lastAccessedAt),
          )}
        </p>
        <div className="mt-auto pt-6">
          <ButtonLink to={learningRoute(course.id)} variant={isCompleted ? "secondary" : "primary"} fullWidth>
            {isCompleted ? "Repasar curso" : "Continuar aprendiendo"}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
