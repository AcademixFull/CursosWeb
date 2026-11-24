import { Link } from "react-router";
import { learningRoute } from "../../config/routes";
import type { LearningCourse } from "../../types/learning.types";
import { classNames } from "../../utils/classNames";

interface LearningCurriculumProps {
  course: LearningCourse;
  activeLessonId: string;
}

export function LearningCurriculum({ course, activeLessonId }: LearningCurriculumProps) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Contenido del curso</p>
        <p className="mt-2 text-sm text-slate-400">
          {course.completedLessons} de {course.totalLessons} lecciones completadas
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {course.modules.map((module) => (
          <details key={module.id} open className="group">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/5">
              <span>{module.position}. {module.title}</span>
              <span className="text-xs font-normal text-slate-500">{module.lessons.length}</span>
            </summary>
            <ol className="border-t border-white/5 pb-2">
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <li key={lesson.id}>
                    <Link
                      to={learningRoute(course.id, lesson.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={classNames(
                        "flex items-start gap-3 px-5 py-3 text-sm transition",
                        isActive ? "bg-brand-500/15 text-brand-100" : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                          lesson.isCompleted ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200" : "border-slate-600",
                        )}
                      >
                        {lesson.isCompleted ? "✓" : ""}
                      </span>
                      <span className="min-w-0">
                        <span className="block leading-5">{lesson.title}</span>
                        <span className="mt-1 block text-xs text-slate-600">{lesson.durationMinutes} min</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </details>
        ))}
      </div>
    </aside>
  );
}
