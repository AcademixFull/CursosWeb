import { useState } from "react";
import { Pagination } from "../components/ui/Pagination";
import { useParams } from "react-router";
import CourseGrid from "../components/courses/CourseGrid";
import { Badge } from "../components/ui/Badge";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { SectionHeader } from "../components/ui/SectionHeader";
import { ROUTES } from "../config/routes";
import { useInstructor, useInstructorCourses } from "../hooks/useInstructor";
import { userErrorMessage } from "../services/api";
import PublicLayout from "../layouts/PublicLayout";

const numberFormatter = new Intl.NumberFormat("es-MX");

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((part) => !part.endsWith("."))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function InstructorPage() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const instructorQuery = useInstructor(instructorId);
  const [page, setPage] = useState(1);
  const coursesQuery = useInstructorCourses(instructorId, page);

  if (instructorQuery.isPending) {
    return (
      <PublicLayout active="cursos" showFooter={false}>
        <PageLoader label="Cargando instructor" />
      </PublicLayout>
    );
  }

  if (instructorQuery.isError) {
    return (
      <PublicLayout active="cursos">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <ErrorState
            title="Instructor no disponible"
            description={userErrorMessage(instructorQuery.error, "No pudimos consultar este perfil. Intenta nuevamente.")}
            onRetry={() => void instructorQuery.refetch()}
          />
          <ButtonLink to={ROUTES.courses} variant="secondary" className="mt-6">
            Volver al catálogo
          </ButtonLink>
        </div>
      </PublicLayout>
    );
  }

  const instructor = instructorQuery.data;

  return (
    <PublicLayout active="cursos">
      <section className="relative overflow-hidden border-b border-violet-500/20 bg-violet-950/70 px-6 py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(124,58,237,0.38),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[auto_1fr]">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={`Retrato de ${instructor.name}`}
              className="h-40 w-40 rounded-3xl border border-white/15 object-cover shadow-2xl"
            />
          ) : (
            <div
              className="flex h-40 w-40 items-center justify-center rounded-3xl border border-violet-300/30 bg-linear-to-br from-violet-600 to-brand-900 text-5xl font-black text-white shadow-2xl"
              aria-hidden="true"
            >
              {getInitials(instructor.name)}
            </div>
          )}

          <div>
            <Badge>Instructor de Academix</Badge>
            <h1 className="mt-5 text-4xl font-extrabold text-white sm:text-5xl">
              {instructor.name}
            </h1>
            <p className="mt-3 text-lg font-semibold text-violet-200">{instructor.specialty}</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-violet-100/75">
              {instructor.biography}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <dl className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <dt className="text-sm text-slate-400">Experiencia profesional</dt>
            <dd className="mt-2 text-3xl font-extrabold text-white">{instructor.experienceYears} años</dd>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <dt className="text-sm text-slate-400">Estudiantes</dt>
            <dd className="mt-2 text-3xl font-extrabold text-white">{numberFormatter.format(instructor.studentCount)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <dt className="text-sm text-slate-400">Cursos publicados</dt>
            <dd className="mt-2 text-3xl font-extrabold text-white">{instructor.courseCount}</dd>
          </div>
        </dl>
      </section>

      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Aprende con especialistas"
            title={`Cursos de ${instructor.name}`}
            description="Explora su contenido disponible y elige el siguiente paso de tu formación."
          />

          <div className="mt-8">
            {coursesQuery.isPending ? <PageLoader label="Cargando cursos" /> : null}
            {coursesQuery.isError ? (
              <ErrorState
                title="No pudimos cargar los cursos"
                description="Intenta nuevamente para consultar el contenido de este instructor."
                onRetry={() => void coursesQuery.refetch()}
              />
            ) : null}
            {coursesQuery.data?.items.length ? <CourseGrid courses={coursesQuery.data.items} /> : null}
            {coursesQuery.data ? <Pagination label="Cursos del instructor" pagination={coursesQuery.data.pagination} onPageChange={setPage} isPending={coursesQuery.isFetching} /> : null}
            {coursesQuery.isSuccess && coursesQuery.data.items.length === 0 ? (
              <EmptyState
                title="Todavía no hay cursos publicados"
                description="El nuevo contenido del instructor aparecerá aquí."
              />
            ) : null}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
