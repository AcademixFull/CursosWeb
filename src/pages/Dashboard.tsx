import { EnrollmentCard } from "../components/student/EnrollmentCard";
import { StudentPageHeader } from "../components/student/StudentPageHeader";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useMyCertificates, useMyCourses } from "../hooks/useStudent";

export default function Dashboard() {
  const { user } = useAuth();
  const coursesQuery = useMyCourses();
  const certificatesQuery = useMyCertificates();

  if (coursesQuery.isLoading || certificatesQuery.isLoading) {
    return <PageLoader label="Preparando tu panel" />;
  }

  if (coursesQuery.isError || certificatesQuery.isError) {
    return (
      <ErrorState
        description="No pudimos consultar tu información de aprendizaje."
        onRetry={() => {
          void coursesQuery.refetch();
          void certificatesQuery.refetch();
        }}
      />
    );
  }

  const courses = coursesQuery.data ?? [];
  const inProgress = courses.filter((item) => item.status === "in_progress");
  const completed = courses.filter((item) => item.status === "completed");
  const learningHours = Math.round(
    courses.reduce((total, item) => total + item.course.durationHours * (item.progressPercentage / 100), 0),
  );
  const metrics = [
    { label: "Cursos en progreso", value: String(inProgress.length) },
    { label: "Cursos completados", value: String(completed.length) },
    { label: "Certificados obtenidos", value: String(certificatesQuery.data?.length ?? 0) },
    { label: "Horas de aprendizaje", value: `${learningHours}h` },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand-400/20 bg-linear-to-r from-brand-800 via-violet-700 to-fuchsia-700 p-7 shadow-2xl shadow-brand-950/40 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">Tu aprendizaje</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Hola, {user?.fullName || "estudiante"}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-brand-100">
          Continúa donde te quedaste y mantén el ritmo para alcanzar tu siguiente meta profesional.
        </p>
      </section>

      <section aria-label="Resumen de aprendizaje" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 shadow-xl shadow-black/20">
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
