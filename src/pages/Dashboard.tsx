import { EnrollmentCard } from "../components/student/EnrollmentCard";
import { StudentPageHeader } from "../components/student/StudentPageHeader";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useLearningSummary, useMyCoursesPage } from "../hooks/useStudent";
import { userErrorMessage } from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const coursesQuery = useMyCoursesPage({ page: 1, limit: 2, status: "in_progress" });
  const summaryQuery = useLearningSummary();

  if (coursesQuery.isLoading) {
    return <PageLoader label="Preparando tu panel" />;
  }

  if (coursesQuery.isError) {
    const error = coursesQuery.error;
    return (
      <ErrorState
        description={userErrorMessage(error, "No pudimos consultar tu información de aprendizaje.")}
        onRetry={() => {
          void coursesQuery.refetch();
          void summaryQuery.refetch();
        }}
      />
    );
  }

  const inProgress = coursesQuery.data?.items ?? [];
  const summary = summaryQuery.data;
  const metrics = [
    { label: "Cursos en progreso", value: String(summary?.inProgress ?? "—") },
    { label: "Cursos completados", value: String(summary?.completed ?? "—") },
    { label: "Certificados obtenidos", value: String(summary?.certificates ?? "—") },
    { label: "Horas de aprendizaje", value: summary ? `${summary.learningHours}h` : "—" },
  ];

  return (
    <div className="min-w-0 space-y-7 sm:space-y-10">
      <section className="academix-dashboard-hero min-w-0 overflow-hidden rounded-3xl border border-brand-400/20 bg-linear-to-r from-brand-800 via-violet-700 to-fuchsia-700 p-5 shadow-2xl shadow-brand-950/40 sm:p-7 lg:p-10">
        <p className="academix-on-brand text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-100 sm:text-xs sm:tracking-[0.18em]">Tu aprendizaje</p>
        <h1 className="academix-on-brand mt-2 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Hola, {user?.fullName || "estudiante"}
        </h1>
        <p className="academix-on-brand mt-3 max-w-2xl text-sm leading-6 text-brand-100 sm:text-base sm:leading-7">
          Continúa donde te quedaste y mantén el ritmo para alcanzar tu siguiente meta profesional.
        </p>
      </section>

      <section aria-label="Resumen de aprendizaje" className="grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="min-w-0 rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-xl shadow-black/20 sm:p-6">
            <p className="text-3xl font-extrabold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-400">{metric.label}</p>
          </article>
        ))}
      </section>

      <section>
        <StudentPageHeader
          eyebrow="Continúa aprendiendo"
          title="Tus cursos activos"
          description="Retoma una lección y avanza a tu propio ritmo."
          action={<ButtonLink to={ROUTES.myCourses} variant="secondary">Ver todos</ButtonLink>}
        />
        {inProgress.length ? (
          <div className="mt-7 grid gap-6 md:grid-cols-2">
            {inProgress.slice(0, 2).map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState
              title="Aún no tienes cursos activos"
              description="Explora el catálogo y elige el curso con el que quieres comenzar."
              action={<ButtonLink to={ROUTES.courses}>Explorar cursos</ButtonLink>}
            />
          </div>
        )}
      </section>
    </div>
  );
}
