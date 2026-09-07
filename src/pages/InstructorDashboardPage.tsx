import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLink } from "../components/ui/Button";
import { authoringRoute } from "../config/routes";
import { managementQueryKeys, useCourseOptions, useInstructorCourses } from "../hooks/useManagement";
import { managementService } from "../services/management.service";
import { useOrganizations } from "../hooks/useOrganizations";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/api";
import type { CourseInput, CourseWorkflowStatus } from "../types/management.types";

const statusLabels: Record<CourseWorkflowStatus, string> = {
  draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado",
};

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const canCreateIndependentCourse = user?.role === "instructor";
  const [status, setStatus] = useState<CourseWorkflowStatus | "">("");
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [newCoursePrice, setNewCoursePrice] = useState("");
  const [coursePrices, setCoursePrices] = useState<Record<string, string>>({});
  const courses = useInstructorCourses(status || undefined);
  const options = useCourseOptions();
  const organizations = useOrganizations();
  const teachingOrganizations = (organizations.data ?? []).filter((organization) => organization.role === "administrator" || organization.role === "instructor");
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: managementService.submitInstructorCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses }),
  });
  const update = useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: Partial<CourseInput> }) => managementService.updateInstructorCourse(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses }),
  });
  const archive = useMutation({
    mutationFn: managementService.archiveInstructorCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses }),
  });
  const create = useMutation({
    mutationFn: managementService.createInstructorCourse,
    onSuccess: async () => {
      setNewCourseTitle("");
      setNewCoursePrice("");
      await queryClient.invalidateQueries({ queryKey: managementQueryKeys.instructorCourses });
    },
  });

  function createCourse(event: FormEvent) {
    event.preventDefault();
    if (!organizationId && !canCreateIndependentCourse) return;
    const category = options.data?.categories[0];
    const level = options.data?.levels[0];
    const modality = options.data?.modalities[0];
    const language = options.data?.languages[0];
    if (!category || !level || !modality || !language) return;
    const input: CourseInput = {
      title: newCourseTitle,
      shortDescription: "",
      description: "",
      learningOutcomes: [],
      requirements: [],
      targetAudience: "Estudiantes",
      categoryId: category.id,
      level: level.value,
      modality: modality.value,
      language: language.code,
      durationHours: null,
      price: organizationId ? 0 : Math.max(0, Number(newCoursePrice) || 0),
      certificateEnabled: true,
      requiresApproval: false,
      ...(organizationId ? { organizationId } : {}),
    };
    create.mutate(input);
  }

  return (
    <section aria-labelledby="instructor-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-brand-300">Panel del instructor</p><h1 id="instructor-title" className="mt-2 text-3xl font-bold">Mis cursos</h1></div>
        <label className="text-sm text-slate-300">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value as CourseWorkflowStatus | "")} className="ml-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
            <option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <form onSubmit={createCourse} className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 md:grid-cols-[minmax(0,1fr)_minmax(13rem,.55fr)_auto]">
        <label htmlFor="instructor-course-title" className="sr-only">Título del nuevo curso</label>
        <input id="instructor-course-title" required minLength={3} value={newCourseTitle} onChange={(event) => setNewCourseTitle(event.target.value)} placeholder="Título de mi nuevo curso" className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-4 py-3" />
        <label className="sr-only" htmlFor="course-organization">Organización del curso</label>
        <select id="course-organization" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200">
          {canCreateIndependentCourse ? <option value="">Curso independiente</option> : <option value="" disabled>Selecciona una organización</option>}
          {teachingOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </select>
        {!organizationId ? <><label htmlFor="new-course-price" className="sr-only">Precio del curso</label><input id="new-course-price" type="number" min="0.01" step="0.01" value={newCoursePrice} onChange={(event) => setNewCoursePrice(event.target.value)} placeholder="Precio" className="rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200 md:max-w-32" /></> : null}
        <Button type="submit" disabled={create.isPending || !options.data || (!organizationId && (!canCreateIndependentCourse || Number(newCoursePrice) <= 0))}>{create.isPending ? "Creando..." : "Crear mi curso"}</Button>
        {organizationId ? <p className="text-xs text-brand-300 md:col-span-3">Curso institucional: está incluido en el plan de la organización y no tiene precio individual para sus estudiantes.</p> : <p className="text-xs text-slate-500 md:col-span-4">{canCreateIndependentCourse ? "Curso independiente: tú defines el precio. Si cambias el precio después de publicar, el curso vuelve a revisión; editar contenido sin cambiar el precio no lo saca de publicación." : "Para crear un curso independiente necesitas la aprobación de Academix como instructor externo."}</p>}
      </form>
      {courses.isPending ? <p className="text-slate-400">Cargando cursos...</p> : null}
      {courses.error ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{courses.error instanceof Error ? courses.error.message : "No se pudieron cargar los cursos."}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {courses.data?.items.map((course) => (
          <article key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-semibold">{course.title}</h2><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{statusLabels[course.status]}</span></div>
            <p className="mt-3 text-sm text-slate-400">{course.shortDescription}</p>{course.organization ? <p className="mt-2 text-xs font-semibold text-brand-300">Organización: {course.organization.name}</p> : <p className="mt-2 text-xs text-slate-500">Curso independiente</p>}
            {course.status === "draft" || course.status === "published" ? <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><input aria-label={`Descripción corta de ${course.title}`} maxLength={300} value={descriptions[course.id] ?? course.shortDescription} onChange={(event) => setDescriptions((current) => ({ ...current, [course.id]: event.target.value }))} className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />{!course.organization ? <input aria-label={`Precio de ${course.title}`} type="number" min="0.01" step="0.01" value={coursePrices[course.id] ?? String(course.price)} onChange={(event) => setCoursePrices((current) => ({ ...current, [course.id]: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm sm:w-28" /> : <span className="self-center text-xs font-semibold text-brand-300">Incluido en plan institucional</span>}<Button size="sm" variant="secondary" disabled={update.isPending} onClick={() => {
              const input: Partial<CourseInput> = { shortDescription: descriptions[course.id] ?? course.shortDescription };
              if (!course.organization) {
                const nextPrice = Math.max(0.01, Number(coursePrices[course.id] ?? course.price) || 0.01);
                if (nextPrice !== course.price) input.price = nextPrice;
              }
              update.mutate({ courseId: course.id, input });
            }}>Guardar datos</Button></div> : null}
            {!course.organization && course.status === "published" ? <p className="mt-2 text-xs text-slate-500">Puedes editar descripción, módulos, lecciones y recursos sin nueva aprobación. Solo un cambio de precio devuelve el curso a revisión de Academix.</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {course.status === "draft" || course.status === "published" ? <ButtonLink to={authoringRoute(course.id)} size="sm">Editar contenido</ButtonLink> : course.status === "review" ? <p className="text-sm text-slate-400">Academix está revisando este curso.</p> : <p className="text-sm text-slate-400">El curso está dado de baja.</p>}
              {course.status === "draft" ? <Button size="sm" variant="secondary" disabled={submit.isPending} onClick={() => submit.mutate(course.id)}>Enviar a revisión</Button> : null}{course.status !== "archived" ? <Button size="sm" variant="ghost" disabled={archive.isPending} onClick={() => archive.mutate(course.id)}>Dar de baja</Button> : null}
            </div>
          </article>
        ))}
      </div>
      {courses.data?.items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">No hay cursos asignados con este estado.</p> : null}
      {submit.error ? <p role="alert" className="mt-4 text-sm text-red-300">{submit.error instanceof ApiError ? submit.error.message : "No se pudo enviar el curso."}</p> : null}
      {update.error ? <p role="alert" className="mt-4 text-sm text-red-300">{update.error instanceof Error ? update.error.message : "No se pudo actualizar el curso."}</p> : null}
      {create.error ? <p role="alert" className="mt-4 text-sm text-red-300">{create.error instanceof Error ? create.error.message : "No se pudo crear el curso."}</p> : null}{archive.error ? <p role="alert" className="mt-4 text-sm text-red-300">{archive.error instanceof Error ? archive.error.message : "No se pudo dar de baja el curso."}</p> : null}
    </section>
  );
}
