import { submitOfflineRequest } from "../offline/requests";
import { env } from "../config/env";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import CourseGrid from "../components/courses/CourseGrid";
import { CourseIntroVideo } from "../components/courses/CourseIntroVideo";
import { EnrollmentDialog } from "../components/enrollment/EnrollmentDialog";
import { ReviewDialog } from "../components/reviews/ReviewDialog";
import { ReviewPagination } from "../components/reviews/ReviewPagination";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { instructorRoute, learningRoute, ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useCourse, useRelatedCourses } from "../hooks/useCourse";
import { useEnrollCourse } from "../hooks/useEnrollment";
import { useCart } from "../hooks/useCart";
import { useCourseReviews, useCreateReview } from "../hooks/useReviews";
import { useMyCoursesPage } from "../hooks/useStudent";
import PublicLayout from "../layouts/PublicLayout";
import { ApiError, userErrorMessage } from "../services/api";
import { formatMxn } from "../utils/currency";
import { locationPath } from "../utils/navigation";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const courseQuery = useCourse(courseId);
  const relatedQuery = useRelatedCourses(courseQuery.data);
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsQuery = useCourseReviews(courseQuery.data?.id, reviewPage);
  const { isAuthenticated, user } = useAuth();
  const enrollmentsQuery = useMyCoursesPage({ courseIds: courseQuery.data ? [courseQuery.data.id] : undefined }, isAuthenticated && Boolean(courseQuery.data));
  const enrollmentMutation = useEnrollCourse();
  const cart = useCart();
  const reviewMutation = useCreateReview(courseId ?? "");
  const [offlineNotice, setOfflineNotice] = useState("");
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
            description={userErrorMessage(courseQuery.error, "No pudimos consultar este curso. Intenta nuevamente.")}
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
  const isEnrolled = enrollmentsQuery.data?.items.some((enrollment) => enrollment.course.id === course.id && enrollment.accessActive !== false) ?? false;
  const enrollment = enrollmentsQuery.data?.items.find((item) => item.course.id === course.id);
  const hasReviewed = reviewConfirmed || course.reviews.some((review) => review.authorId === user?.id)
    || reviewsQuery.data?.items.some((review) => review.authorId === user?.id) === true;

  function addToCart() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { returnTo: locationPath(location) } });
      return;
    }
    cart.addCourse(course);
  }

  function startEnrollment() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { state: { returnTo: locationPath(location) } });
      return;
    }
    enrollmentMutation.reset();
    setShowEnrollment(true);
  }

  async function confirmEnrollment() {
    try {
      if (user && env.dataSource === "api") {
        const outcome = await submitOfflineRequest(user.id, { kind: "enrollment", courseId: course.id },
          () => enrollmentMutation.mutateAsync(course.id));
        if (outcome.queued) {
          setOfflineNotice("Inscripción guardada. Se enviará cuando vuelva la conexión.");
          setShowEnrollment(false);
          return;
        }
      } else {
        await enrollmentMutation.mutateAsync(course.id);
      }
      setShowEnrollment(false);
      navigate(learningRoute(course.id));
    } catch (error) {
      if (error instanceof ApiError && error.code === "ENROLLMENT_ALREADY_EXISTS") {
        setShowEnrollment(false);
        navigate(learningRoute(course.id));
      } else if (!navigator.onLine) {
        setOfflineNotice("No pudimos guardar la inscripción en este dispositivo.");
        setShowEnrollment(false);
      }
    }
  }

  async function publishReview(input: { rating: number; comment: string }) {
    try {
      await reviewMutation.mutateAsync({ courseId: course.id, input });
      setReviewConfirmed(true);
      setReviewPage(1);
      setShowReview(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "REVIEW_ALREADY_EXISTS") {
        setReviewConfirmed(true);
        setShowReview(false);
        void reviewsQuery.refetch();
      }
      // El diálogo muestra el error de publicación.
    }
  }

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
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{course.shortDescription}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
                <span>Por {course.instructor.name}</span>
                <span>★ {course.rating} ({course.reviewCount} reseñas)</span>
                <span>{course.durationHours} horas</span>
              </div>
            </div>
            <figure className="min-w-0">
              <CourseIntroVideo
                key={course.introVideoUrl ?? course.id}
                src={course.introVideoUrl}
                poster={course.imageUrl}
                onRetry={courseQuery.refetch}
              />
              {course.introVideoUrl ? (
                <figcaption className="mt-3 text-sm font-semibold text-slate-300">Video introductorio</figcaption>
              ) : null}
            </figure>
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
                            <li key={lesson.id} className="flex flex-col gap-2 py-3 text-sm text-slate-300 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                              <span>{lesson.title}{lesson.isPreview ? " · Vista previa" : ""}</span>
                              <span className="shrink-0 text-slate-500">{lesson.durationMinutes} min</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">
                      Este curso no tiene lecciones publicadas.
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
                  <ButtonLink
                    to={instructorRoute(course.instructor.id)}
                    variant="secondary"
                    size="sm"
                    className="mt-5"
                  >
                    Ver perfil del instructor
                  </ButtonLink>
                </div>
              </section>

              <section>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">Opiniones de estudiantes</h2>
                    <p className="mt-2 text-sm text-slate-400">{course.rating} de 5 · {course.reviewCount} reseñas</p>
                  </div>
                  {enrollment?.status === "completed" && !hasReviewed ? (
                    <Button variant="secondary" onClick={() => { reviewMutation.reset(); setShowReview(true); }}>
                      Escribir reseña
                    </Button>
                  ) : null}
                </div>
                <div id="course-reviews" className="mt-6 divide-y divide-white/10">
                  {reviewsQuery.isPending ? (
                    <p className="py-5 text-sm text-slate-400" role="status">
                      Cargando reseñas...
                    </p>
                  ) : null}
                  {reviewsQuery.isError ? (
                    <ErrorState
                      title="No pudimos cargar las reseñas"
                      description={userErrorMessage(reviewsQuery.error, "No pudimos cargar las reseñas. Intenta nuevamente.")}
                      onRetry={() => void reviewsQuery.refetch()}
                    />
                  ) : null}
                  {reviewsQuery.data?.items.length ? (
                    reviewsQuery.data.items.map((review) => (
                      <article key={review.id} className="py-6 first:pt-0">
                        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                          <h3 className="font-bold text-white">{review.authorName}</h3>
                          <span className="text-sm text-amber-300">{"★".repeat(review.rating)}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
                        <time dateTime={review.createdAt} className="mt-3 block text-xs text-slate-500">
                          {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
                            new Date(review.createdAt),
                          )}
                        </time>
                      </article>
                    ))
                  ) : null}
                  {reviewsQuery.isSuccess && reviewsQuery.data.items.length === 0 ? (
                    <p className="text-slate-400">Este curso todavía no tiene reseñas publicadas.</p>
                  ) : null}
                </div>
                {reviewsQuery.data ? (
                  <ReviewPagination
                    pagination={reviewsQuery.data.pagination}
                    isFetching={reviewsQuery.isFetching}
                    onPageChange={setReviewPage}
                  />
                ) : null}
                {enrollment?.status === "completed" && hasReviewed ? (
                  <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Gracias por compartir tu experiencia con la comunidad.
                  </p>
                ) : null}
                {!isAuthenticated ? (
                  <p className="mt-5 text-sm text-slate-500">Inicia sesión para consultar si puedes publicar una reseña.</p>
                ) : null}
                {isEnrolled && enrollment?.status !== "completed" ? (
                  <p className="mt-5 text-sm text-slate-500">Completa el curso para poder publicar una reseña.</p>
                ) : null}
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30 lg:sticky lg:top-28">
              <p className="text-3xl font-extrabold text-white">{formatMxn(course.price)}</p>
              {course.savedPreview ? <p className="mt-2 text-sm text-slate-400">Vista guardada del catálogo. El detalle completo se actualizará con conexión.</p> : null}
              {offlineNotice ? <p role="status" className="mt-3">{offlineNotice}</p> : null}
              {isAuthenticated && !cart.ownershipReady && (course.price > 0 || (navigator.onLine && !course.savedPreview)) ? (
                <Button size="lg" fullWidth className="mt-5" disabled>
                  {enrollmentsQuery.isError ? "No pudimos verificar tus cursos" : "Consultando tus cursos..."}
                </Button>
              ) : isEnrolled ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-emerald-300">Ya lo tienes{enrollment?.status === "completed" ? " · Curso completado" : ""}</p>
                  <ButtonLink to={learningRoute(course.id)} size="lg" fullWidth className="mt-5">
                    Ver material
                  </ButtonLink>
                </>
              ) : course.price > 0 ? (
                <>
                  <Button
                    size="lg"
                    fullWidth
                    className="mt-5"
                    disabled={isAuthenticated && cart.hasCourse(course.id)}
                    onClick={addToCart}
                  >
                    {!isAuthenticated
                      ? "Iniciar sesión para agregar"
                      : cart.hasCourse(course.id)
                        ? "Ya está en tu carrito"
                        : "Agregar al carrito"}
                  </Button>
                  {isAuthenticated ? (
                    <ButtonLink to={ROUTES.cart} variant="secondary" size="lg" fullWidth className="mt-3">
                      Ver carrito
                    </ButtonLink>
                  ) : null}
                </>
              ) : (
                <Button size="lg" fullWidth className="mt-5" onClick={startEnrollment} disabled={enrollmentsQuery.isLoading && navigator.onLine && !course.savedPreview}>
                  {enrollmentsQuery.isLoading && navigator.onLine && !course.savedPreview ? "Consultando..." : "Inscribirme ahora"}
                </Button>
              )}
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

        {showEnrollment ? (
          <EnrollmentDialog
            courseTitle={course.title}
            priceLabel={formatMxn(course.price)}
            isPending={enrollmentMutation.isPending}
            error={
              enrollmentMutation.isError
                ? userErrorMessage(enrollmentMutation.error, "No pudimos completar la inscripción. Intenta nuevamente.")
                : undefined
            }
            onClose={() => setShowEnrollment(false)}
            onConfirm={() => void confirmEnrollment()}
          />
        ) : null}
        {showReview ? (
          <ReviewDialog
            courseTitle={course.title}
            isPending={reviewMutation.isPending}
            serverError={reviewMutation.isError ? userErrorMessage(reviewMutation.error, "No pudimos publicar la reseña. Intenta nuevamente.") : undefined}
            onClose={() => setShowReview(false)}
            onSubmit={(input) => void publishReview(input)}
          />
        ) : null}
    </PublicLayout>
  );
}
