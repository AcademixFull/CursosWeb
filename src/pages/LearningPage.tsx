import { Link, Navigate, useParams } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { LearningCurriculum } from "../components/learning/LearningCurriculum";
import { ProgressBar } from "../components/student/ProgressBar";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { learningRoute, ROUTES } from "../config/routes";
import { useCompleteLesson, useLearningCourse } from "../hooks/useLearning";

export default function LearningPage() {
  const { courseId = "", lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const query = useLearningCourse(courseId);
  const completeMutation = useCompleteLesson(courseId);

  if (query.isLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><PageLoader label="Preparando tu lección" /></div>;
  }
  if (query.isError || !query.data) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-2xl">
          <ErrorState description={query.error instanceof Error ? query.error.message : "No pudimos abrir este curso."} onRetry={() => void query.refetch()} />
          <div className="mt-6 text-center"><ButtonLink to={ROUTES.myCourses} variant="secondary">Volver a mis cursos</ButtonLink></div>
        </div>
      </main>
    );
  }

  const course = query.data;
  const lessons = course.modules.flatMap((module) => module.lessons);
  const defaultLesson = lessons.find((lesson) => !lesson.isCompleted) ?? lessons[0];
  const activeLesson = lessons.find((lesson) => lesson.id === lessonId);

  if (!lessonId || !activeLesson) {
    return defaultLesson ? <Navigate to={learningRoute(course.id, defaultLesson.id)} replace /> : <Navigate to={ROUTES.myCourses} replace />;
  }

  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : undefined;
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo />
          <Link to={ROUTES.myCourses} className="text-sm font-semibold text-slate-400 transition hover:text-white">
            Salir del curso
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <LearningCurriculum course={course} activeLessonId={activeLesson.id} />

        <div className="min-w-0">
          <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-black shadow-2xl shadow-black/30">
            <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_40%),linear-gradient(135deg,#020617,#0f172a)]">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-2xl shadow-brand-600/30" aria-hidden="true">▶</div>
                <p className="mt-5 text-sm font-semibold text-slate-300">Reproductor disponible al conectar el contenido de video</p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{activeLesson.durationMinutes} minutos</Badge>
              {activeLesson.isPreview ? <Badge tone="neutral">Vista previa</Badge> : null}
              {activeLesson.isCompleted ? <Badge tone="success">Completada</Badge> : null}
            </div>
            <p className="mt-5 text-sm font-medium text-brand-300">{course.title}</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{activeLesson.title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">{activeLesson.description}</p>

            {completeMutation.isError ? (
              <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                No pudimos guardar tu progreso. Intenta nuevamente.
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {previousLesson ? (
                  <ButtonLink to={learningRoute(course.id, previousLesson.id)} variant="secondary">← Lección anterior</ButtonLink>
                ) : <span />}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => completeMutation.mutate(activeLesson.id)}
                  disabled={activeLesson.isCompleted || completeMutation.isPending}
                >
                  {activeLesson.isCompleted ? "Lección completada" : completeMutation.isPending ? "Guardando..." : "Marcar como completada"}
                </Button>
                {nextLesson ? (
                  <ButtonLink to={learningRoute(course.id, nextLesson.id)} variant="secondary">Siguiente lección →</ButtonLink>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900 p-6">
            <ProgressBar value={course.progressPercentage} label="Progreso total del curso" />
            <p className="mt-3 text-xs text-slate-500">Instructor: {course.instructorName}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
