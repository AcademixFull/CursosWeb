import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLink } from "../components/ui/Button";
import { authoringRoute } from "../config/routes";
import { managementQueryKeys, useInstructorCourses } from "../hooks/useManagement";
import { managementService } from "../services/management.service";
import { ApiError } from "../services/api";
import type { CourseWorkflowStatus } from "../types/management.types";

const statusLabels: Record<CourseWorkflowStatus, string> = {
  draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado",
};

export default function InstructorDashboardPage() {
  const [status, setStatus] = useState<CourseWorkflowStatus | "">("");
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const courses = useInstructorCourses(status || undefined);
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: managementService.submitInstructorCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses }),
  });
  const update = useMutation({
    mutationFn: ({ courseId, shortDescription }: { courseId: string; shortDescription: string }) => managementService.updateInstructorCourse(courseId, { shortDescription }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses }),
  });

  return (
    <section aria-labelledby="instructor-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-brand-300">Panel del instructor</p><h1 id="instructor-title" className="mt-2 text-3xl font-bold">Cursos asignados</h1></div>
        <label className="text-sm text-slate-300">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value as CourseWorkflowStatus | "")} className="ml-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
            <option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {courses.isPending ? <p className="text-slate-400">Cargando cursos...</p> : null}
      {courses.error ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{courses.error instanceof Error ? courses.error.message : "No se pudieron cargar los cursos."}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {courses.data?.items.map((course) => (
          <article key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-semibold">{course.title}</h2><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{statusLabels[course.status]}</span></div>
            <p className="mt-3 text-sm text-slate-400">{course.shortDescription}</p>
            {course.status === "draft" ? <div className="mt-4 flex gap-2"><input aria-label={`Descripción corta de ${course.title}`} maxLength={300} value={descriptions[course.id] ?? course.shortDescription} onChange={(event) => setDescriptions((current) => ({ ...current, [course.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><Button size="sm" variant="secondary" disabled={update.isPending} onClick={() => update.mutate({ courseId: course.id, shortDescription: descriptions[course.id] ?? course.shortDescription })}>Guardar datos</Button></div> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to={authoringRoute(course.id)} size="sm">Editar contenido</ButtonLink>
              {course.status === "draft" ? <Button size="sm" variant="secondary" disabled={submit.isPending} onClick={() => submit.mutate(course.id)}>Enviar a revisión</Button> : null}
            </div>
          </article>
        ))}
      </div>
      {courses.data?.items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">No hay cursos asignados con este estado.</p> : null}
      {submit.error ? <p role="alert" className="mt-4 text-sm text-red-300">{submit.error instanceof ApiError ? submit.error.message : "No se pudo enviar el curso."}</p> : null}
      {update.error ? <p role="alert" className="mt-4 text-sm text-red-300">{update.error instanceof Error ? update.error.message : "No se pudo actualizar el curso."}</p> : null}
    </section>
  );
}
