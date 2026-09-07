import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/Button";
import { useCourseContent, useInvalidateCourseContent, useResourceOptions } from "../hooks/useManagement";
import { managementService } from "../services/management.service";
import type { AuthoringLesson } from "../types/management.types";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";

const statusLabels = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado" } as const;

function acceptedFiles(typeName: string): string | undefined {
  const value = typeName.toLowerCase();
  if (value.includes("video")) return "video/*";
  if (value.includes("imagen")) return "image/*";
  if (value.includes("audio")) return "audio/*";
  if (value.includes("pdf") || value.includes("document")) return ".pdf,.doc,.docx,.ppt,.pptx";
  return undefined;
}

function LessonResourceForm({ courseId, lesson, refresh, resourceTypes }: { courseId: string; lesson: AuthoringLesson; refresh: () => Promise<unknown>; resourceTypes: Array<{ id: number; name: string }> }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [typeId, setTypeId] = useState("");
  const [source, setSource] = useState<"file" | "url">("file");
  const selectedType = resourceTypes.find((type) => String(type.id) === typeId);
  const save = useMutation({
    mutationFn: async () => {
      const uploaded = file ? await managementService.uploadCourseFile(courseId, file) : null;
      return managementService.createResource(lesson.id, { typeId: Number(typeId), title, description: "", url: file ? null : url, fileId: uploaded?.id ?? null, required: false, position: lesson.resources.length + 1 });
    },
    onSuccess: async () => { setTitle(""); setUrl(""); setFile(null); await refresh(); },
  });
  function submit(event: FormEvent) { event.preventDefault(); save.mutate(); }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-2">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del recurso" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
      <select required value={typeId} onChange={(e) => { setTypeId(e.target.value); setFile(null); }} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2"><option value="">¿Qué material agregarás?</option>{resourceTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
      <div className="flex gap-2 sm:col-span-2"><Button type="button" size="sm" variant={source === "file" ? "primary" : "secondary"} onClick={() => { setSource("file"); setUrl(""); }}>Subir archivo</Button><Button type="button" size="sm" variant={source === "url" ? "primary" : "secondary"} onClick={() => { setSource("url"); setFile(null); }}>Usar enlace</Button></div>
      {source === "url" ? <input required value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="Pega aquí el enlace del material" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 sm:col-span-2" /> : <div className="rounded-xl border border-dashed border-brand-400/50 bg-brand-500/5 p-4 sm:col-span-2"><input id={`resource-file-${lesson.id}`} type="file" accept={acceptedFiles(selectedType?.name ?? "")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" /><label htmlFor={`resource-file-${lesson.id}`} className="inline-flex cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">{selectedType?.name.toLowerCase().includes("video") ? "Elegir video" : "Elegir archivo"}</label><span className="ml-3 text-sm text-slate-300">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Ningún archivo seleccionado"}</span><p className="mt-2 text-xs text-slate-400">Tamaño máximo: 25 MB.</p></div>}
      <Button type="submit" size="sm" className="sm:col-span-2" disabled={save.isPending || !typeId || (source === "url" ? !url : !file)}>{save.isPending ? "Subiendo..." : source === "file" ? `Subir ${selectedType?.name.toLowerCase() || "archivo"} y agregar` : "Agregar enlace"}</Button>
      {save.error ? <p role="alert" className="text-sm text-red-300 sm:col-span-2">{save.error instanceof Error ? save.error.message : "No se pudo agregar el recurso."}</p> : null}
    </form>
  );
}

export default function AuthoringPage() {
  const { courseId = "" } = useParams();
  const content = useCourseContent(courseId);
  const resourceOptions = useResourceOptions();
  const refresh = useInvalidateCourseContent(courseId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const createModule = useMutation({ mutationFn: () => managementService.createModule(courseId, { title: moduleTitle, description: "", position: (content.data?.modules.length ?? 0) + 1 }), onSuccess: async () => { setModuleTitle(""); await refresh(); } });
  const createLesson = useMutation({
    mutationFn: ({ moduleId, title, position }: { moduleId: string; title: string; position: number }) => managementService.createLesson(moduleId, { title, description: "", content: "", durationMinutes: 0, position, isPreview: false }),
    onSuccess: async (_, variables) => { setLessonTitles((current) => ({ ...current, [variables.moduleId]: "" })); await refresh(); },
  });
  const toggle = useMutation({
    mutationFn: async ({ kind, id, active }: { kind: "module" | "lesson" | "resource"; id: string; active: boolean }) => {
      if (kind === "module") await managementService.updateModule(id, { active });
      else if (kind === "lesson") await managementService.updateLesson(id, { active });
      else await managementService.updateResource(id, { active });
    },
    onSuccess: refresh,
  });
  const finish = useMutation({
    mutationFn: () => managementService.submitInstructorCourse(courseId),
    onSuccess: () => navigate(ROUTES.instructorPanel),
  });

  return (
    <section aria-labelledby="authoring-title">
      <p className="text-sm font-semibold text-brand-300">Editor del curso</p><h1 id="authoring-title" className="mt-2 text-3xl font-bold">Contenido del curso</h1>
      <p className="mt-2 text-slate-400">Organiza los módulos, lecciones y materiales que verán tus estudiantes.</p>
      {content.isPending ? <p className="mt-8 text-slate-400">Cargando contenido...</p> : null}
      {content.error ? <p role="alert" className="mt-8 text-red-300">{content.error instanceof Error ? content.error.message : "No se pudo cargar el contenido."}</p> : null}
      {content.data ? <p className="mt-5 text-sm text-slate-400">Estado: <strong className="text-slate-200">{statusLabels[content.data.status]}</strong></p> : null}
      <form onSubmit={(e) => { e.preventDefault(); createModule.mutate(); }} className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:flex-row">
        <label className="sr-only" htmlFor="module-title">Título del módulo</label><input id="module-title" required value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Nuevo módulo" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5" />
        <Button type="submit" disabled={createModule.isPending}>Crear módulo</Button>
      </form>
      <div className="mt-6 space-y-5">
        {content.data?.modules.map((module) => (
          <article key={module.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{module.position}. {module.title}</h2><Button size="sm" variant="ghost" onClick={() => toggle.mutate({ kind: "module", id: module.id, active: !module.active })}>{module.active ? "Desactivar" : "Activar"}</Button></div>
            <div className="mt-4 space-y-4">{module.lessons.map((lesson) => (
              <section key={lesson.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{lesson.position}. {lesson.title}</h3><Button size="sm" variant="ghost" onClick={() => toggle.mutate({ kind: "lesson", id: lesson.id, active: !lesson.active })}>{lesson.active ? "Desactivar" : "Activar"}</Button></div><p className="mt-1 text-xs text-slate-400">{lesson.durationMinutes} min · {lesson.isPreview ? "Vista previa" : "Solo inscritos"}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">{lesson.resources.map((resource) => <li key={resource.id} className="flex items-center justify-between gap-3"><span>• {resource.title} <span className="text-slate-500">({resource.type})</span></span><Button size="sm" variant="ghost" onClick={() => toggle.mutate({ kind: "resource", id: resource.id, active: !resource.active })}>{resource.active ? "Desactivar" : "Activar"}</Button></li>)}</ul>
                <LessonResourceForm courseId={courseId} lesson={lesson} refresh={refresh} resourceTypes={resourceOptions.data ?? []} />
              </section>
            ))}</div>
            <form onSubmit={(e) => { e.preventDefault(); createLesson.mutate({ moduleId: module.id, title: lessonTitles[module.id] ?? "", position: module.lessons.length + 1 }); }} className="mt-4 flex gap-3">
              <input required value={lessonTitles[module.id] ?? ""} onChange={(e) => setLessonTitles((current) => ({ ...current, [module.id]: e.target.value }))} placeholder="Nueva lección" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
              <Button type="submit" size="sm" variant="secondary" disabled={createLesson.isPending}>Agregar lección</Button>
            </form>
          </article>
        ))}
      </div>
      {content.data ? <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-6"><Button variant="secondary" onClick={() => navigate(user?.role === "admin" ? ROUTES.admin : ROUTES.instructorPanel)}>Guardar y salir</Button>{user?.role === "instructor" && content.data.status === "draft" ? <Button onClick={() => finish.mutate()} disabled={finish.isPending}>{finish.isPending ? "Enviando..." : "Finalizar y enviar a revisión"}</Button> : null}</div> : null}
      {finish.error ? <p role="alert" className="mt-3 text-right text-sm text-red-300">{finish.error instanceof Error ? finish.error.message : "No se pudo finalizar el curso."}</p> : null}
    </section>
  );
}
