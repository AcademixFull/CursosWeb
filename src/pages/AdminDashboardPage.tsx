import { type FormEvent, useState } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { authoringRoute } from "../config/routes";
import { useAdminActions, useAdminData } from "../hooks/useManagement";
import type { UserRole } from "../types/auth.types";
import type { CourseInput } from "../types/management.types";

type Tab = "users" | "applications" | "courses" | "reviews" | "categories";
const inputClass = "w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm";
const roleLabels: Record<UserRole, string> = { student: "Alumno", instructor: "Instructor", admin: "Administrador" };
const courseStatusLabels = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado" } as const;

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
      <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{user.fullName}</strong><p className="text-sm text-slate-400">{user.email} · <span className={user.active ? "text-emerald-300" : "text-red-300"}>{user.active ? "Activo" : "Desactivado"}</span></p></div><div className="flex flex-wrap items-center gap-3">{(["student", "instructor", "admin"] as UserRole[]).map((role) => <label key={role} className="text-sm"><input type="checkbox" checked={rolesFor(user.id, user.roles).includes(role)} onChange={() => toggleRole(user.id, user.roles, role)} className="mr-1" />{roleLabels[role]}</label>)}<Button size="sm" disabled={actions.setRoles.isPending || rolesFor(user.id, user.roles).length === 0} onClick={() => actions.setRoles.mutate({ userId: user.id, roles: rolesFor(user.id, user.roles) })}>Guardar roles</Button><Button size="sm" variant={user.active ? "ghost" : "primary"} disabled={actions.setUserStatus.isPending} onClick={() => actions.setUserStatus.mutate({ userId: user.id, active: !user.active })}>{user.active ? "Desactivar usuario" : "Reactivar usuario"}</Button></div></div>
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
  const [price, setPrice] = useState("");
  const [coursePrices, setCoursePrices] = useState<Record<string, string>>({});
  const options = data.options.data;
  function create(event: FormEvent) {
    event.preventDefault();
    const category = options?.categories[0];
    const level = options?.levels[0];
    const modality = options?.modalities[0];
    const language = options?.languages[0];
    if (!category || !level || !modality || !language) return;
    const input: CourseInput = { title, shortDescription: `Curso ${title}`, description: `Contenido de ${title}`, learningOutcomes: ["Completar el curso"], requirements: [], targetAudience: "Estudiantes", categoryId: category.id, level: level.value, modality: modality.value, language: language.code, durationHours: null, price: Number(price), certificateEnabled: true, requiresApproval: false };
    actions.createCourse.mutate(input, { onSuccess: () => { setTitle(""); setPrice(""); } });
  }
  return <div className="space-y-5">
    <h2 className="text-2xl font-semibold">Cursos y publicación</h2>
    <p className="text-sm text-slate-400">Los cursos institucionales están cubiertos por el plan de su organización. En cursos independientes, Academix puede ajustar un precio excesivo; si el instructor cambia el precio de un curso ya publicado, vuelve a revisión.</p>
    <form onSubmit={create} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[1fr_10rem_auto]"><input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del nuevo curso" className={inputClass} /><input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio USD" aria-label="Precio del nuevo curso" className={inputClass} /><Button type="submit" disabled={!options || actions.createCourse.isPending || Number(price) <= 0}>Crear borrador</Button></form>
    {data.courses.data?.items.map((course) => <article key={course.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><strong>{course.title}</strong><p className="text-sm text-slate-400">{courseStatusLabels[course.status]} · {course.instructor?.name ?? "Sin instructor"} · {course.organization ? "Incluido en plan institucional" : `USD ${course.price.toFixed(2)}`}</p>{course.organization ? <p className="mt-1 text-xs font-semibold text-brand-300">Organización: {course.organization.name} · sin precio individual</p> : <p className="mt-1 text-xs text-slate-500">Academix puede ajustar el precio de un curso independiente cuando sea necesario.</p>}</div><div className="flex flex-wrap items-center gap-2">{course.status !== "archived" && !course.organization ? <><input aria-label={`Precio de ${course.title}`} type="number" min="0.01" step="0.01" value={coursePrices[course.id] ?? String(course.price)} onChange={(e) => setCoursePrices((current) => ({ ...current, [course.id]: e.target.value }))} className="w-28 rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm" /><Button size="sm" variant="secondary" disabled={actions.updateCourse.isPending || Number(coursePrices[course.id] ?? course.price) <= 0} onClick={() => actions.updateCourse.mutate({ courseId: course.id, input: { price: Number(coursePrices[course.id] ?? course.price) } })}>Ajustar precio</Button></> : null}{course.status !== "archived" ? <><select aria-label={`Instructor de ${course.title}`} defaultValue={course.instructor?.id ?? ""} onChange={(e) => e.target.value && actions.assignInstructor.mutate({ courseId: course.id, instructorId: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-2 text-sm"><option value="">Asignar instructor</option>{data.instructors.data?.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>)}</select><ButtonLink to={authoringRoute(course.id)} size="sm" variant="secondary">Editar contenido</ButtonLink></> : null}{course.status === "review" ? <Button size="sm" onClick={() => actions.publish.mutate(course.id)}>Publicar</Button> : null}{course.status !== "archived" ? <Button size="sm" variant="secondary" onClick={() => actions.archive.mutate(course.id)}>Archivar</Button> : null}{course.status === "archived" ? <Button size="sm" onClick={() => actions.restore.mutate(course.id)}>Restaurar como borrador</Button> : null}</div></div>
    </article>)}
  </div>;
}

function ReviewsPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Moderación de reseñas</h2>{data.reviews.data?.items.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong>{review.courseTitle}</strong><p className="text-sm text-slate-400">{review.authorName} · {review.rating}/5</p></div><span className="text-xs">{review.visible ? "Visible" : "Oculta"}</span></div><p className="my-3 text-sm">{review.comment}</p>{review.visible ? <div className="flex flex-col gap-2 sm:flex-row"><input value={reasons[review.id] ?? ""} onChange={(e) => setReasons((current) => ({ ...current, [review.id]: e.target.value }))} minLength={5} placeholder="Motivo de moderación" className={inputClass} /><Button size="sm" disabled={(reasons[review.id]?.length ?? 0) < 5} onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: false, reason: reasons[review.id] })}>Ocultar</Button></div> : <Button size="sm" onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: true })}>Restaurar</Button>}</article>)}</div>;
}

function CategoriesPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [name, setName] = useState("");
  return <div><h2 className="text-2xl font-semibold">Categorías</h2><p className="mt-2 text-slate-400">Las categorías desactivadas no aparecen en el catálogo, pero puedes volver a activarlas aquí.</p><form onSubmit={(e) => { e.preventDefault(); actions.createCategory.mutate({ name }, { onSuccess: () => setName("") }); }} className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row"><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de categoría" className={inputClass} /><Button type="submit">Crear</Button></form><div className="mt-4 grid gap-3 sm:grid-cols-2">{data.categories.data?.map((category) => <div key={category.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm"><span><strong>{category.name}</strong><span className="ml-2 text-xs text-slate-400">{category.active ? "Activa" : "Desactivada"}</span></span><Button size="sm" variant={category.active ? "ghost" : "primary"} onClick={() => actions.updateCategory.mutate({ categoryId: category.id, active: !category.active })}>{category.active ? "Desactivar" : "Activar"}</Button></div>)}</div></div>;
}

function ApplicationsPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [specialties, setSpecialties] = useState<Record<string, string>>({});
  const [years, setYears] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Solicitudes para enseñar</h2><p className="text-slate-400">Revisa las credenciales antes de habilitar el acceso de instructor.</p>{data.applications.data?.map((application) => <article key={application.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-5"><div><strong>{application.applicantName}</strong><p className="text-sm text-slate-400">{application.applicantEmail} · Matrícula: {application.enrollmentId}</p><p className="mt-2 text-sm">Comprobante: {application.credentialReference}</p></div>{application.status === "pending" ? <div className="mt-4 grid gap-3 md:grid-cols-3"><input value={specialties[application.id] ?? ""} onChange={(e) => setSpecialties((current) => ({ ...current, [application.id]: e.target.value }))} placeholder="Especialidad" className={inputClass} /><input type="number" min="0" value={years[application.id] ?? 0} onChange={(e) => setYears((current) => ({ ...current, [application.id]: Number(e.target.value) }))} aria-label="Años de experiencia" className={inputClass} /><input value={notes[application.id] ?? ""} onChange={(e) => setNotes((current) => ({ ...current, [application.id]: e.target.value }))} placeholder="Comentarios para el solicitante" className={inputClass} /><div className="flex flex-wrap gap-2 md:col-span-3"><Button size="sm" disabled={!specialties[application.id]} onClick={() => actions.resolveApplication.mutate({ applicationId: application.id, decision: "approved", specialty: specialties[application.id], experienceYears: years[application.id] ?? 0, observations: notes[application.id] })}>Aprobar</Button><Button size="sm" variant="secondary" onClick={() => actions.resolveApplication.mutate({ applicationId: application.id, decision: "rejected", observations: notes[application.id] })}>No aprobar</Button></div></div> : <p className="mt-3 text-sm font-semibold">{application.status === "approved" ? "Aprobada" : "No aprobada"}</p>}</article>)}</div>;
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("users");
  const data = useAdminData();
  const actions = useAdminActions();
  const error = [data.users.error, data.instructors.error, data.courses.error, data.reviews.error, data.options.error, data.categories.error, data.applications.error].find(Boolean);
  const actionError = Object.values(actions).map((action) => action.error).find(Boolean);
  return <section aria-labelledby="admin-title" className="min-w-0"><p className="text-sm font-semibold text-brand-300">Panel administrativo</p><h1 id="admin-title" className="mt-2 text-3xl font-bold">Gestión de Academix</h1>
    <div role="tablist" aria-label="Secciones administrativas" className="my-8 flex flex-wrap gap-2">{(["users", "applications", "courses", "reviews", "categories"] as Tab[]).map((item) => <Button key={item} role="tab" aria-selected={tab === item} variant={tab === item ? "primary" : "secondary"} size="sm" onClick={() => setTab(item)}>{{ users: "Usuarios", applications: "Solicitudes", courses: "Cursos", reviews: "Reseñas", categories: "Categorías" }[item]}</Button>)}</div>
    {error ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error instanceof Error ? error.message : "No se pudo cargar la administración."}</p> : null}
    {actionError ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{actionError instanceof Error ? actionError.message : "La operación no pudo completarse."}</p> : null}
    {tab === "users" ? <UsersPanel data={data} actions={actions} /> : null}{tab === "applications" ? <ApplicationsPanel data={data} actions={actions} /> : null}{tab === "courses" ? <CoursesPanel data={data} actions={actions} /> : null}{tab === "reviews" ? <ReviewsPanel data={data} actions={actions} /> : null}{tab === "categories" ? <CategoriesPanel data={data} actions={actions} /> : null}
  </section>;
}
