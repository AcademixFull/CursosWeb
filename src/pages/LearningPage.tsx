import { Link, Navigate, useParams } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { SkipLink } from "../components/a11y/SkipLink";
import { LearningCurriculum } from "../components/learning/LearningCurriculum";
import { LessonResources } from "../components/learning/LessonResources";
import { ProgressBar } from "../components/student/ProgressBar";
import { Badge } from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { learningRoute, ROUTES } from "../config/routes";
import { useLearningCourse, useSetLessonProgress } from "../hooks/useLearning";
import { userErrorMessage } from "../services/api";

export default function LearningPage() {
  const { courseId = "", lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const query = useLearningCourse(courseId);
  const progressMutation = useSetLessonProgress(courseId);

  if (query.isLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><PageLoader label="Preparando tu lección" /></div>;
  }
  if (query.isError || !query.data) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-2xl">
          <ErrorState description={userErrorMessage(query.error, "No pudimos abrir este curso.")} onRetry={() => void query.refetch()} />
          <div className="mt-6 text-center"><ButtonLink to={ROUTES.myCourses} variant="secondary">Volver a mis cursos</ButtonLink></div>
        </div>
      </main>
    );
  }

  const course = query.data;
  const lessons = course.modules.flatMap((module) => module.lessons);
  if (!lessons.length) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-2xl">
          <ErrorState description="Este curso todavía no tiene lecciones publicadas." />
          <div className="mt-6 text-center"><ButtonLink to={ROUTES.myCourses} variant="secondary">Volver a mis cursos</ButtonLink></div>
        </div>
      </main>
    );
  }
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
      <SkipLink />
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-[90rem] flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLogo />
          <Link to={ROUTES.myCourses} className="text-sm font-semibold text-slate-400 transition hover:text-white">
            Salir del curso
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto grid min-w-0 max-w-[90rem] gap-6 px-4 py-6 outline-none sm:px-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <LearningCurriculum course={course} activeLessonId={activeLesson.id} />

        <div className="min-w-0">
          <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{activeLesson.durationMinutes} minutos</Badge>
              {activeLesson.isPreview ? <Badge tone="neutral">Vista previa</Badge> : null}
              {activeLesson.isCompleted ? <Badge tone="success">Completada</Badge> : null}
            </div>
            <p className="mt-5 text-sm font-medium text-brand-300">{course.title}</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{activeLesson.title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">{activeLesson.description}</p>
            {activeLesson.content ? (
              <div className="mt-6 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/60 p-5 leading-7 text-slate-300">
                {activeLesson.content}
              </div>
            ) : null}

            {progressMutation.isError ? (
              <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {userErrorMessage(progressMutation.error, "No pudimos guardar tu progreso. Intenta nuevamente.")}
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
                  onClick={() => progressMutation.mutate({ lessonId: activeLesson.id, completed: !activeLesson.isCompleted })}
                  disabled={progressMutation.isPending}
                >
                  {progressMutation.isPending
                    ? "Guardando..."
                    : activeLesson.isCompleted
                      ? "Marcar como pendiente"
                      : "Marcar como completada"}
                </Button>
                {nextLesson ? (
                  <ButtonLink to={learningRoute(course.id, nextLesson.id)} variant="secondary">Siguiente lección →</ButtonLink>
                ) : null}
              </div>
            </div>
          </section>

          <LessonResources resources={activeLesson.resources} />

          <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900 p-6">
            <ProgressBar value={course.progressPercentage} label="Progreso total del curso" />
            <p className="mt-3 text-xs text-slate-500">Instructor: {course.instructorName}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
