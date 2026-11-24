import { useMemo, useState, type FormEvent } from "react";
import { LessonResources } from "../components/learning/LessonResources";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useModerationActions, useModerationCourse, useModerationCourses } from "../hooks/useModeration";
import { userErrorMessage } from "../services/api";
import type { LearningResource } from "../types/learning.types";
import type { AuthoringLesson, CourseWorkflowStatus, ManagedCourse } from "../types/management.types";
import type { ModerationCourseStatus } from "../types/moderation.types";
import { classNames } from "../utils/classNames";

const statusLabels: Record<CourseWorkflowStatus, string> = {
  draft: "Borrador",
  review: "En revisión",
  published: "Publicado",
  archived: "Archivado",
  moderated: "Dado de baja por moderación",
};

const previousStatusLabels: Record<CourseWorkflowStatus, string> = statusLabels;
const filterStatuses: Array<{ value: ModerationCourseStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "review", label: "En revisión" },
  { value: "published", label: "Publicados" },
  { value: "moderated", label: "Dados de baja" },
];

function dateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: CourseWorkflowStatus): "brand" | "neutral" | "success" | "warning" {
  if (status === "published") return "success";
  if (status === "review" || status === "moderated") return "warning";
  return "neutral";
}

function LessonContent({ lesson }: { lesson: AuthoringLesson }) {
  const resources = useMemo<LearningResource[]>(() => lesson.resources.map((resource) => ({
    id: resource.id,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    required: resource.required,
    position: resource.position,
    url: resource.url,
    contentPath: resource.fileId
      ? `/api/v1/lessons/${lesson.id}/resources/${resource.id}/content`
      : null,
  })), [lesson.id, lesson.resources]);

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-100">{lesson.title}</h4>
          {lesson.description ? <p className="mt-1 text-sm leading-6 text-slate-400">{lesson.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{lesson.durationMinutes} min</span>
          {lesson.isPreview ? <span>Vista previa</span> : null}
          {!lesson.active ? <span className="font-semibold text-amber-300">Inactiva</span> : null}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Contenido de la lección</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {lesson.content || "Esta lección no tiene contenido textual."}
        </p>
      </div>
      <LessonResources resources={resources} />
    </article>
  );
}

function CourseSummary({ course }: { course: ManagedCourse }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Instructor</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{course.instructor?.name ?? "Sin instructor"}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Organización</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{course.organization?.name ?? "Curso independiente"}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Modalidad</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{{ self_paced: "Autogestivo", live: "En vivo", blended: "Mixto" }[course.modality]}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Actualizado</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{dateTime(course.updatedAt)}</p>
      </div>
    </div>
  );
}

function ModerationDetail({ courseId }: { courseId: string }) {
  const detail = useModerationCourse(courseId);
  const actions = useModerationActions(courseId);
  const [reason, setReason] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (detail.isPending) {
    return <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-sm text-slate-400">Cargando contenido completo del curso...</div>;
  }
  if (detail.error) {
    return <ErrorState description={userErrorMessage(detail.error, "No pudimos cargar el curso. Intenta nuevamente.")} onRetry={() => void detail.refetch()} />;
  }
  if (!detail.data) return null;

  const { course, content, moderationHistory } = detail.data;
  const canTakeDown = course.status === "review" || course.status === "published";
  const canRestore = course.status === "moderated";
  const actionError = actions.takeDown.error ?? actions.restore.error;

  function submitTakedown(event: FormEvent) {
    event.preventDefault();
    const normalized = reason.trim();
    if (normalized.length < 10) return;
    actions.takeDown.mutate(normalized, {
      onSuccess: () => {
        setReason("");
        setSuccessMessage("El curso quedó dado de baja por moderación y el instructor fue notificado.");
      },
    });
  }

  function restore() {
    actions.restore.mutate(undefined, {
      onSuccess: () => {
        setConfirmRestore(false);
        setSuccessMessage("El curso fue restaurado después de confirmar que vuelve a cumplir los lineamientos.");
      },
    });
  }

  return (
    <section aria-labelledby="moderation-course-title" className="min-w-0 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Revisión del curso</p>
            <h2 id="moderation-course-title" className="mt-2 break-words text-2xl font-bold text-slate-100 sm:text-3xl">{course.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{course.description || course.shortDescription || "Sin descripción."}</p>
          </div>
          <Badge tone={statusTone(course.status)} className="shrink-0 self-start">{statusLabels[course.status]}</Badge>
        </div>
        <div className="mt-6"><CourseSummary course={course} /></div>

        {(course.learningOutcomes.length || course.requirements.length || course.targetAudience) ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="font-bold text-slate-100">Objetivos</h3>
              {course.learningOutcomes.length ? <ul className="mt-3 space-y-2 text-sm text-slate-400">{course.learningOutcomes.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Sin objetivos registrados.</p>}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="font-bold text-slate-100">Requisitos</h3>
              {course.requirements.length ? <ul className="mt-3 space-y-2 text-sm text-slate-400">{course.requirements.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Sin requisitos.</p>}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="font-bold text-slate-100">Público objetivo</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{course.targetAudience || "No especificado."}</p>
            </div>
          </div>
        ) : null}
      </div>

      <section aria-labelledby="course-content-title" className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Contenido completo</p>
            <h3 id="course-content-title" className="mt-2 text-xl font-bold text-slate-100">Módulos, lecciones y recursos</h3>
          </div>
          <p className="text-sm text-slate-500">{content.modules.length} módulo{content.modules.length === 1 ? "" : "s"}</p>
        </div>
        {content.modules.length ? (
          <div className="mt-5 space-y-4">
            {[...content.modules].sort((a, b) => a.position - b.position).map((module) => (
              <details key={module.id} className="group rounded-2xl border border-white/10 bg-slate-950/40">
                <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <span className="min-w-0">
                    <span className="block break-words font-bold text-slate-100">{module.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{module.lessons.length} lección{module.lessons.length === 1 ? "" : "es"}{!module.active ? " · módulo inactivo" : ""}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-brand-300 transition group-open:rotate-180">⌄</span>
                </summary>
                <div className="space-y-4 border-t border-white/10 p-4 sm:p-5">
                  {module.description ? <p className="text-sm leading-6 text-slate-400">{module.description}</p> : null}
                  {[...module.lessons].sort((a, b) => a.position - b.position).map((lesson) => <LessonContent key={lesson.id} lesson={lesson} />)}
                  {!module.lessons.length ? <p className="text-sm text-slate-500">Este módulo no tiene lecciones.</p> : null}
                </div>
              </details>
            ))}
          </div>
        ) : <EmptyState title="Curso sin contenido" description="Este curso todavía no tiene módulos ni lecciones para revisar." />}
      </section>

      <section aria-labelledby="history-title" className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-7">
        <h3 id="history-title" className="text-xl font-bold text-slate-100">Historial de moderación</h3>
        {moderationHistory.length ? (
          <div className="mt-5 space-y-3">
            {moderationHistory.map((record) => (
              <article key={record.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{record.moderator.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Moderado: {dateTime(record.moderatedAt)} · antes estaba {previousStatusLabels[record.previousStatus]}</p>
                  </div>
                  <Badge tone={record.active ? "warning" : "neutral"}>{record.active ? "Baja activa" : "Restaurado"}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{record.reason}</p>
                {record.restoredBy ? <p className="mt-3 text-xs text-emerald-300">Restaurado por {record.restoredBy.name} · {dateTime(record.restoredAt)}</p> : null}
              </article>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-slate-500">Este curso no tiene intervenciones de moderación.</p>}
      </section>

      <section aria-labelledby="moderation-action-title" className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-7">
        <h3 id="moderation-action-title" className="text-xl font-bold text-slate-100">Decisión de moderación</h3>
        {canTakeDown ? (
          <form onSubmit={submitTakedown} className="mt-4">
            <label htmlFor="moderation-reason" className="text-sm font-semibold text-slate-200">Motivo de la baja</label>
            <p className="mt-1 text-xs leading-5 text-slate-500">Describe con claridad qué contenido incumple los lineamientos. El instructor recibirá este motivo.</p>
            <textarea id="moderation-reason" required minLength={10} maxLength={2000} rows={5} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100" placeholder="Ejemplo: la lección 3 contiene material que..." />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className={classNames("text-xs", reason.trim().length >= 10 ? "text-slate-500" : "text-amber-300")}>{reason.trim().length}/2000 · mínimo 10 caracteres</span>
              <Button type="submit" variant="danger" disabled={actions.takeDown.isPending || reason.trim().length < 10}>{actions.takeDown.isPending ? "Dando de baja..." : "Dar de baja por moderación"}</Button>
            </div>
          </form>
        ) : null}

        {canRestore ? (
          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-sm leading-6 text-emerald-200">Si ya revisaste las correcciones del instructor y el curso vuelve a cumplir los lineamientos, puedes restaurarlo. La acción quedará registrada.</p>
            {!confirmRestore ? <Button className="mt-4" onClick={() => setConfirmRestore(true)}>Restaurar curso</Button> : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-200">¿Confirmas que el contenido corregido ya cumple?</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmRestore(false)}>Cancelar</Button>
                  <Button size="sm" disabled={actions.restore.isPending} onClick={restore}>{actions.restore.isPending ? "Restaurando..." : "Sí, restaurar"}</Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {!canTakeDown && !canRestore ? <p className="mt-4 text-sm text-slate-400">Este estado es solo de consulta. La baja por moderación se aplica a cursos publicados o en revisión.</p> : null}
        {successMessage ? <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{successMessage}</p> : null}
        {actionError ? <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{userErrorMessage(actionError, "No pudimos completar la acción. Intenta nuevamente.")}</p> : null}
      </section>
    </section>
  );
}

export default function ModerationDashboardPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ModerationCourseStatus | "">("");
  const [page, setPage] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const filters = useMemo(() => ({
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    page,
    limit: 12,
  }), [page, search, status]);
  const courses = useModerationCourses(filters);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  const totalPages = Math.max(1, courses.data?.pagination.totalPages ?? 1);
  const selectedVisibleCourseId = selectedCourseId && courses.data?.items.some((course) => course.id === selectedCourseId)
    ? selectedCourseId
    : courses.data?.items[0]?.id ?? "";

  return (
    <section aria-labelledby="moderation-title" className="min-w-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-300">Panel de Moderación</p>
          <h1 id="moderation-title" className="mt-2 text-3xl font-bold text-slate-100 sm:text-4xl">Revisión de contenido</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">Revisa cursos, módulos, lecciones, enlaces y archivos protegidos. Las bajas conservan todo el contenido y el historial para que pueda restaurarse cuando vuelva a cumplir.</p>
        </div>
        <Badge tone="warning">Moderación con trazabilidad</Badge>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
        <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(11rem,.35fr)_auto]">
          <label className="min-w-0">
            <span className="sr-only">Buscar curso</span>
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={100} placeholder="Buscar por curso o instructor" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100" />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value as ModerationCourseStatus | ""); setPage(1); }} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100">
              {filterStatuses.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Button type="submit">Buscar</Button>
        </form>
      </div>

      {courses.error ? <div className="mt-6"><ErrorState description={userErrorMessage(courses.error, "No pudimos cargar los cursos. Intenta nuevamente.")} onRetry={() => void courses.refetch()} /></div> : null}

      <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <aside className="min-w-0" aria-label="Cursos para moderar">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-100">Cursos</h2>
            <span className="text-xs text-slate-500">{courses.data?.pagination.total ?? 0} resultado{courses.data?.pagination.total === 1 ? "" : "s"}</span>
          </div>
          {courses.isPending ? <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">Cargando cursos...</p> : null}
          <div className="mt-3 space-y-3">
            {courses.data?.items.map((course) => (
              <button key={course.id} type="button" onClick={() => setSelectedCourseId(course.id)} aria-pressed={selectedVisibleCourseId === course.id} className={classNames(
                "w-full rounded-2xl border p-4 text-left transition",
                selectedVisibleCourseId === course.id
                  ? "border-brand-400/40 bg-brand-500/10 ring-1 ring-inset ring-brand-400/15"
                  : "border-white/10 bg-slate-900/60 hover:border-brand-400/25 hover:bg-white/5",
              )}>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-sm font-bold text-slate-100">{course.title}</h3>
                  <span className="shrink-0 text-brand-300" aria-hidden="true">›</span>
                </div>
                <p className="mt-2 break-words text-xs text-slate-500">{course.instructor?.name ?? "Sin instructor"}</p>
                <div className="mt-3"><Badge tone={statusTone(course.status)}>{statusLabels[course.status]}</Badge></div>
              </button>
            ))}
          </div>
          {courses.data?.items.length === 0 ? <div className="mt-4"><EmptyState title="Sin cursos" description="No encontramos cursos con estos filtros." /></div> : null}
          {courses.data && courses.data.pagination.total > 0 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
              <span className="text-xs text-slate-500">Página {page} de {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente</Button>
            </div>
          ) : null}
        </aside>

        <div className="min-w-0">
          {selectedVisibleCourseId ? <ModerationDetail key={selectedVisibleCourseId} courseId={selectedVisibleCourseId} /> : <EmptyState title="Selecciona un curso" description="Elige un curso de la lista para revisar todo su contenido y su historial." />}
        </div>
      </div>
    </section>
  );
}
