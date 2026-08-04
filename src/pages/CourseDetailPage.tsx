import { useParams } from "react-router";
import CourseGrid from "../components/courses/CourseGrid";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "../config/routes";
import { useCourse, useRelatedCourses } from "../hooks/useCourse";
import PublicLayout from "../layouts/PublicLayout";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const courseQuery = useCourse(courseId);
  const relatedQuery = useRelatedCourses(courseId);

  if (courseQuery.isPending) {
    return (
      <PublicLayout active="cursos" showFooter={false}>
        <PageLoader label="Cargando curso" />
      </PublicLayout>
    );
  }

  if (courseQuery.isError) {
    return (
      <PublicLayout active="cursos">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <ErrorState
            title="Curso no disponible"
            description={
              courseQuery.error instanceof Error
                ? courseQuery.error.message
                : "No fue posible consultarlo."
            }
            onRetry={() => void courseQuery.refetch()}
          />
          <ButtonLink to={ROUTES.courses} variant="secondary" className="mt-6">
            Volver al catálogo
          </ButtonLink>
        </div>
      </PublicLayout>
    );
  }

  const course = courseQuery.data;

  return (
    <PublicLayout active="cursos">
        <section className="relative overflow-hidden border-b border-violet-500/20 bg-violet-950/70 px-6 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(124,58,237,0.4),transparent_35%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge>
                {course.category.name}
              </Badge>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                {course.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-violet-100/80">{course.shortDescription}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-violet-100">
                <span>Por {course.instructor.name}</span>
                <span>★ {course.rating} ({course.reviewCount} reseñas)</span>
                <span>{course.durationHours} horas</span>
              </div>
            </div>
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-violet-700/40 to-slate-950 shadow-2xl">
              <span className="rounded-full bg-violet-600 p-6 text-2xl shadow-xl" aria-label="Vista previa del curso">
                ▶
              </span>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-extrabold text-white">Lo que aprenderás</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {course.learningOutcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="text-violet-400">✓</span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-extrabold text-white">Descripción general</h2>
                <p className="mt-5 leading-8 text-slate-300">{course.description}</p>
              </section>

              <section>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-white">Temario del curso</h2>
                  <span className="text-sm text-slate-400">{course.modules.length} módulos</span>
                </div>
                <div className="mt-6 space-y-3">
                  {course.modules.length ? (
                    course.modules.map((module) => (
                      <details key={module.id} className="group rounded-xl border border-slate-700 bg-slate-900" open={module.position === 1}>
                        <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-white">
                          {String(module.position).padStart(2, "0")} · {module.title}
                        </summary>
                        <ul className="border-t border-white/10 px-5 py-3">
                          {module.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-center justify-between gap-4 py-3 text-sm text-slate-300">
                              <span>{lesson.title}{lesson.isPreview ? " · Vista previa" : ""}</span>
                              <span className="shrink-0 text-slate-500">{lesson.durationMinutes} min</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">
                      El temario detallado se publicará próximamente.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-extrabold text-white">Acerca del instructor</h2>
                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
                  <p className="text-xl font-bold text-white">{course.instructor.name}</p>
                  <p className="mt-1 text-sm font-semibold text-violet-300">{course.instructor.specialty}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Especialista responsable de guiar el contenido, los ejercicios y el proyecto final del curso.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-extrabold text-white">Opiniones de estudiantes</h2>
                <div className="mt-6 divide-y divide-white/10">
                  {course.reviews.length ? (
                    course.reviews.map((review) => (
                      <article key={review.id} className="py-6 first:pt-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-bold text-white">{review.authorName}</h3>
                          <span className="text-sm text-amber-300">{"★".repeat(review.rating)}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
                      </article>
                    ))
                  ) : (
                    <p className="text-slate-400">Este curso todavía no tiene reseñas publicadas.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30 lg:sticky lg:top-28">
              <p className="text-3xl font-extrabold text-white">{formatPrice(course.price)}</p>
              <Button size="lg" fullWidth className="mt-5">
                Inscribirme ahora
              </Button>
              <Button variant="secondary" size="lg" fullWidth className="mt-3">
                Añadir al carrito
              </Button>
              <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-400">
                <p>Este curso incluye:</p>
                <ul className="mt-3 space-y-2">
                  <li>{course.durationHours} horas de contenido</li>
                  <li>Idioma: {course.language}</li>
                  <li>{course.certificateEnabled ? "Certificado de finalización" : "Sin certificado"}</li>
                  <li>Acceso de por vida</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {relatedQuery.data?.length ? (
          <section className="border-t border-white/10 bg-slate-900/50 px-6 py-16">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-3xl font-extrabold text-white">Cursos relacionados</h2>
              <div className="mt-8">
                <CourseGrid courses={relatedQuery.data} />
              </div>
            </div>
          </section>
        ) : null}
    </PublicLayout>
  );
}
