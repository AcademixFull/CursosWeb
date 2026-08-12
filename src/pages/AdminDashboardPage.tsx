import { type FormEvent, useState } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { authoringRoute } from "../config/routes";
import { useAdminActions, useAdminData } from "../hooks/useManagement";
import type { UserRole } from "../types/auth.types";
import type { CourseInput } from "../types/management.types";

type Tab = "users" | "courses" | "reviews" | "categories";
const inputClass = "w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm";

function UsersPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole[]>>({});
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [instructorId, setInstructorId] = useState("");
  function rolesFor(id: string, fallback: UserRole[]) { return draftRoles[id] ?? fallback; }
  function toggleRole(id: string, fallback: UserRole[], role: UserRole) {
    const roles = rolesFor(id, fallback);
    setDraftRoles((current) => ({ ...current, [id]: roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role] }));
  }
  return <div className="space-y-5">
    <h2 className="text-2xl font-semibold">Usuarios y roles</h2>
    {data.users.data?.items.map((user) => <article key={user.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{user.fullName}</strong><p className="text-sm text-slate-400">{user.email}</p></div><div className="flex flex-wrap gap-3">{(["student", "instructor", "admin"] as UserRole[]).map((role) => <label key={role} className="text-sm"><input type="checkbox" checked={rolesFor(user.id, user.roles).includes(role)} onChange={() => toggleRole(user.id, user.roles, role)} className="mr-1" />{role}</label>)}<Button size="sm" disabled={actions.setRoles.isPending || rolesFor(user.id, user.roles).length === 0} onClick={() => actions.setRoles.mutate({ userId: user.id, roles: rolesFor(user.id, user.roles) })}>Guardar</Button></div></div>
    </article>)}
    <form onSubmit={(e) => { e.preventDefault(); actions.upsertInstructor.mutate({ userId: instructorId, specialty, experienceYears }); }} className="grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-4">
      <select required value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={inputClass}><option value="">Usuario instructor</option>{data.users.data?.items.filter((user) => user.roles.includes("instructor")).map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select>
      <input required value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Especialidad" className={inputClass} />
      <input required type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} aria-label="Años de experiencia" className={inputClass} />
      <Button type="submit" disabled={actions.upsertInstructor.isPending}>Guardar instructor</Button>
    </form>
  </div>;
}

function CoursesPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [title, setTitle] = useState("");
  const options = data.options.data;
  function create(event: FormEvent) {
    event.preventDefault();
    const category = options?.categories[0];
    const level = options?.levels[0];
    const modality = options?.modalities[0];
    const language = options?.languages[0];
    if (!category || !level || !modality || !language) return;
    const input: CourseInput = { title, shortDescription: `Curso ${title}`, description: `Contenido de ${title}`, learningOutcomes: ["Completar el curso"], requirements: [], targetAudience: "Estudiantes", categoryId: category.id, level: level.value, modality: modality.value, language: language.code, durationHours: null, price: 0, certificateEnabled: true, requiresApproval: false };
    actions.createCourse.mutate(input, { onSuccess: () => setTitle("") });
  }
  return <div className="space-y-5">
    <h2 className="text-2xl font-semibold">Cursos y publicación</h2>
    <form onSubmit={create} className="flex gap-3 rounded-xl border border-white/10 p-4"><input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del nuevo curso" className={inputClass} /><Button type="submit" disabled={!options || actions.createCourse.isPending}>Crear borrador</Button></form>
    {data.courses.data?.items.map((course) => <article key={course.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><strong>{course.title}</strong><p className="text-sm text-slate-400">{course.status} · {course.instructor?.name ?? "Sin instructor"}</p></div><div className="flex flex-wrap gap-2"><select aria-label={`Instructor de ${course.title}`} defaultValue={course.instructor?.id ?? ""} onChange={(e) => e.target.value && actions.assignInstructor.mutate({ courseId: course.id, instructorId: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-2 text-sm"><option value="">Asignar instructor</option>{data.instructors.data?.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>)}</select><ButtonLink to={authoringRoute(course.id)} size="sm" variant="secondary">Contenido</ButtonLink>{course.status !== "published" ? <Button size="sm" onClick={() => actions.publish.mutate(course.id)}>Publicar</Button> : <Button size="sm" variant="secondary" onClick={() => actions.archive.mutate(course.id)}>Archivar</Button>}</div></div>
    </article>)}
  </div>;
}

function ReviewsPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Moderación de reseñas</h2>{data.reviews.data?.items.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong>{review.courseTitle}</strong><p className="text-sm text-slate-400">{review.authorName} · {review.rating}/5</p></div><span className="text-xs">{review.visible ? "Visible" : "Oculta"}</span></div><p className="my-3 text-sm">{review.comment}</p>{review.visible ? <div className="flex gap-2"><input value={reasons[review.id] ?? ""} onChange={(e) => setReasons((current) => ({ ...current, [review.id]: e.target.value }))} minLength={5} placeholder="Motivo de moderación" className={inputClass} /><Button size="sm" disabled={(reasons[review.id]?.length ?? 0) < 5} onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: false, reason: reasons[review.id] })}>Ocultar</Button></div> : <Button size="sm" onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: true })}>Restaurar</Button>}</article>)}</div>;
}

function CategoriesPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [name, setName] = useState("");
  return <div><h2 className="text-2xl font-semibold">Categorías</h2><form onSubmit={(e) => { e.preventDefault(); actions.createCategory.mutate({ name }, { onSuccess: () => setName("") }); }} className="mt-5 flex gap-3 rounded-xl border border-white/10 p-4"><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de categoría" className={inputClass} /><Button type="submit">Crear</Button></form><div className="mt-4 flex flex-wrap gap-2">{data.options.data?.categories.map((category) => <div key={category.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm"><span>{category.name}</span><Button size="sm" variant="ghost" onClick={() => actions.updateCategory.mutate({ categoryId: category.id, active: false })}>Desactivar</Button></div>)}</div></div>;
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("users");
  const data = useAdminData();
  const actions = useAdminActions();
  const error = [data.users.error, data.instructors.error, data.courses.error, data.reviews.error, data.options.error].find(Boolean);
  const actionError = Object.values(actions).map((action) => action.error).find(Boolean);
  return <section aria-labelledby="admin-title"><p className="text-sm font-semibold text-brand-300">Panel administrativo</p><h1 id="admin-title" className="mt-2 text-3xl font-bold">Gestión de Academix</h1>
    <div role="tablist" aria-label="Secciones administrativas" className="my-8 flex flex-wrap gap-2">{(["users", "courses", "reviews", "categories"] as Tab[]).map((item) => <Button key={item} role="tab" aria-selected={tab === item} variant={tab === item ? "primary" : "secondary"} size="sm" onClick={() => setTab(item)}>{{ users: "Usuarios", courses: "Cursos", reviews: "Reseñas", categories: "Categorías" }[item]}</Button>)}</div>
    {error ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error instanceof Error ? error.message : "No se pudo cargar la administración."}</p> : null}
    {actionError ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{actionError instanceof Error ? actionError.message : "La operación no pudo completarse."}</p> : null}
    {tab === "users" ? <UsersPanel data={data} actions={actions} /> : null}{tab === "courses" ? <CoursesPanel data={data} actions={actions} /> : null}{tab === "reviews" ? <ReviewsPanel data={data} actions={actions} /> : null}{tab === "categories" ? <CategoriesPanel data={data} actions={actions} /> : null}
  </section>;
}
