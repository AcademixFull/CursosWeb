import { ConfirmationDialog } from "../components/ui/ConfirmationDialog";
import { DataTable } from "../components/ui/DataTable";
import { useEffect } from "react";
import type { ManagedUser, UserListFilters } from "../types/management.types";
import { Pagination } from "../components/ui/Pagination";
import { type FormEvent, useState } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { authoringRoute, ROUTES } from "../config/routes";
import { useAdminActions, useAdminData } from "../hooks/useManagement";
import { userErrorMessage } from "../services/api";
import type { UserRole } from "../types/auth.types";
import type { AdminFilters, CourseInput, CourseWorkflowStatus, InstructorApplicationStatus } from "../types/management.types";
import { formatMxn } from "../utils/currency";

type Tab = "users" | "applications" | "courses" | "reviews" | "categories";
const inputClass = "w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm";
const roleLabels: Record<UserRole, string> = { student: "Alumno", instructor: "Instructor", moderator: "Moderador", admin: "Administrador global" };
const courseStatusLabels = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado", moderated: "Dado de baja por moderación" } as const;

function UsersPanel({ data, actions, filters, onSort }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions>; filters: UserListFilters; onSort: (field: string) => void }) {
  const [confirmUser, setConfirmUser] = useState<ManagedUser | null>(null);
  const [success, setSuccess] = useState("");
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole[]>>({});
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [instructorId, setInstructorId] = useState("");
  function rolesFor(id: string, fallback: UserRole[]) { return draftRoles[id] ?? fallback; }
  function hasOperationalConflict(roles: UserRole[]) {
    return roles.includes("instructor") && roles.includes("moderator");
  }
  function toggleRole(id: string, fallback: UserRole[], role: UserRole) {
    const roles = rolesFor(id, fallback);
    let next = roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];
    if (role === "instructor" && next.includes("instructor")) {
      next = next.filter((item) => item !== "moderator");
    }
    if (role === "moderator" && next.includes("moderator")) {
      next = next.filter((item) => item !== "instructor");
    }
    setDraftRoles((current) => ({ ...current, [id]: next }));
  }
  return <div className="space-y-5">
    <h2 className="text-2xl font-semibold">Usuarios y roles</h2><p className="text-sm text-slate-400">Los roles globales aplican en todo Academix. Para nombrar un Administrador institucional, abre su organización y cambia el rol de un miembro; sus permisos se limitan a esa institución.</p><ButtonLink to={ROUTES.organization} size="sm" variant="secondary">Administrar roles institucionales</ButtonLink>
    {success ? <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">{success}</p> : null}
    <DataTable caption="Usuarios y roles globales" rows={data.users.data?.items ?? []} rowKey={(row) => row.id}
      sort={filters.sort ?? "createdAt"} direction={filters.direction ?? "desc"} onSort={onSort}
      columns={[
        { key: "identity", label: "Usuario", sort: "name", render: (user) => <div className="min-w-40"><strong>{user.fullName}</strong><p className="mt-1 break-all text-xs text-slate-400">{user.email}</p>{user.institutionalOrganizations?.map((org) => <p key={org.id} className="mt-1 text-xs text-brand-300">Administrador institucional · {org.name}</p>)}</div> },
        { key: "status", label: "Estado", render: (user) => <span className={`inline-block rounded-full px-2 py-1 text-xs ${user.active ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{user.active ? "Activo" : "Desactivado"}</span> },
        { key: "roles", label: "Permisos globales", render: (user) => <fieldset aria-label={`Roles de ${user.fullName}`} className="grid min-w-48 grid-cols-2 gap-3">{(["student", "instructor", "moderator", "admin"] as UserRole[]).map((role) => <label key={role} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rolesFor(user.id, user.roles).includes(role)} onChange={() => toggleRole(user.id, user.roles, role)} />{roleLabels[role]}</label>)}{hasOperationalConflict(rolesFor(user.id, user.roles)) ? <p className="col-span-2 text-xs text-amber-300">Elige Instructor o Moderador antes de guardar.</p> : null}</fieldset> },
        { key: "actions", label: "Acciones", render: (user) => <div className="flex min-w-48 flex-wrap gap-2"><Button size="sm" disabled={actions.setRoles.isPending || rolesFor(user.id, user.roles).length === 0 || hasOperationalConflict(rolesFor(user.id, user.roles))} onClick={() => actions.setRoles.mutate({ userId: user.id, roles: rolesFor(user.id, user.roles) }, { onSuccess: () => setSuccess(`Permisos de ${user.fullName} actualizados.`) })}>Guardar roles</Button><Button size="sm" variant="secondary" disabled={actions.setUserStatus.isPending} onClick={() => setConfirmUser(user)}>{user.active ? "Desactivar" : "Reactivar"}</Button></div> },
      ]} />
    <ConfirmationDialog open={Boolean(confirmUser)} title={confirmUser?.active ? "Desactivar usuario" : "Reactivar usuario"} pending={actions.setUserStatus.isPending} danger={confirmUser?.active} onCancel={() => setConfirmUser(null)} onConfirm={() => {
      if (confirmUser) actions.setUserStatus.mutate({ userId: confirmUser.id, active: !confirmUser.active }, { onSuccess: () => { setSuccess("Estado de la cuenta actualizado."); setConfirmUser(null); } });
    }}><p>{confirmUser?.active ? `Se bloqueará el acceso de ${confirmUser.fullName}. Sus cursos y datos se conservarán.` : `Se restaurará el acceso de ${confirmUser?.fullName}.`}</p></ConfirmationDialog>
    <form onSubmit={(e) => { e.preventDefault(); actions.upsertInstructor.mutate({ userId: instructorId, specialty, experienceYears }); }} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2 xl:grid-cols-4">
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
    <form onSubmit={create} className="grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-[minmax(0,1fr)_10rem_auto]"><input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del nuevo curso" className={inputClass} /><input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio MXN" aria-label="Precio del nuevo curso" className={inputClass} /><Button type="submit" disabled={!options || actions.createCourse.isPending || Number(price) <= 0}>Crear borrador</Button></form>
    {data.courses.data?.items.map((course) => <article key={course.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><strong className="break-words">{course.title}</strong><p className="break-words text-sm text-slate-400">{courseStatusLabels[course.status]} · {course.instructor?.name ?? "Sin instructor"} · {course.organization ? "Incluido en plan institucional" : formatMxn(course.price)}</p>{course.organization ? <p className="mt-1 text-xs font-semibold text-brand-300">Organización: {course.organization.name} · sin precio individual</p> : <p className="mt-1 text-xs text-slate-500">Academix puede ajustar el precio de un curso independiente cuando sea necesario.</p>}</div><div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">{!course.organization ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label={`Mostrar ${course.title} en destacados`} checked={course.featuredVisible !== false} disabled={actions.updateCourse.isPending} onChange={(event) => actions.updateCourse.mutate({ courseId: course.id, input: { featuredVisible: event.target.checked } })} />Visible en destacados</label> : null}{course.status !== "archived" && course.status !== "moderated" && !course.organization ? <><input aria-label={`Precio de ${course.title}`} type="number" min="0.01" step="0.01" value={coursePrices[course.id] ?? String(course.price)} onChange={(e) => setCoursePrices((current) => ({ ...current, [course.id]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm min-[420px]:w-28" /><Button size="sm" variant="secondary" disabled={actions.updateCourse.isPending || Number(coursePrices[course.id] ?? course.price) <= 0} onClick={() => actions.updateCourse.mutate({ courseId: course.id, input: { price: Number(coursePrices[course.id] ?? course.price) } })}>Ajustar precio</Button></> : null}{course.status !== "archived" && course.status !== "moderated" ? <><select aria-label={`Instructor de ${course.title}`} defaultValue={course.instructor?.id ?? ""} onChange={(e) => e.target.value && actions.assignInstructor.mutate({ courseId: course.id, instructorId: e.target.value })} className="min-w-0 max-w-full flex-1 rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm min-[520px]:flex-none"><option value="">Asignar instructor</option>{data.instructors.data?.items.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>)}</select><ButtonLink to={authoringRoute(course.id)} size="sm" variant="secondary">Editar contenido</ButtonLink></> : null}{course.status === "review" ? <Button size="sm" onClick={() => actions.publish.mutate(course.id)}>Publicar</Button> : null}{course.status !== "archived" && course.status !== "moderated" ? <Button size="sm" variant="secondary" onClick={() => actions.archive.mutate(course.id)}>Archivar</Button> : null}{course.status === "archived" ? <Button size="sm" onClick={() => actions.restore.mutate(course.id)}>Restaurar como borrador</Button> : null}{course.status === "moderated" ? <ButtonLink to={ROUTES.moderation} size="sm">Revisar moderación</ButtonLink> : null}</div></div>
    </article>)}
  </div>;
}

function ReviewsPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Moderación de reseñas</h2>{data.reviews.data?.items.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong>{review.courseTitle}</strong><p className="text-sm text-slate-400">{review.authorName} · {review.rating}/5</p></div><span className="text-xs">{review.visible ? "Visible" : "Oculta"}</span></div><p className="my-3 text-sm">{review.comment}</p>{review.visible ? <div className="flex flex-col gap-2 sm:flex-row"><input value={reasons[review.id] ?? ""} onChange={(e) => setReasons((current) => ({ ...current, [review.id]: e.target.value }))} minLength={5} placeholder="Motivo de moderación" className={inputClass} /><Button size="sm" disabled={(reasons[review.id]?.length ?? 0) < 5} onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: false, reason: reasons[review.id] })}>Ocultar</Button></div> : <Button size="sm" onClick={() => actions.moderate.mutate({ reviewId: review.id, visible: true })}>Restaurar</Button>}</article>)}</div>;
}

function CategoriesPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [name, setName] = useState("");
  return <div><h2 className="text-2xl font-semibold">Categorías</h2><p className="mt-2 text-slate-400">Las categorías desactivadas no aparecen en el catálogo, pero puedes volver a activarlas aquí.</p><form onSubmit={(e) => { e.preventDefault(); actions.createCategory.mutate({ name }, { onSuccess: () => setName("") }); }} className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row"><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de categoría" className={inputClass} /><Button type="submit">Crear</Button></form><div className="mt-4 grid gap-3 sm:grid-cols-2">{data.categories.data?.items.map((category) => <div key={category.id} className="flex flex-col gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"><span><strong>{category.name}</strong><span className="ml-2 text-xs text-slate-400">{category.active ? "Activa" : "Desactivada"}</span></span><Button size="sm" variant={category.active ? "ghost" : "primary"} onClick={() => actions.updateCategory.mutate({ categoryId: category.id, active: !category.active })}>{category.active ? "Desactivar" : "Activar"}</Button></div>)}</div></div>;
}

function ApplicationsPanel({ data, actions }: { data: ReturnType<typeof useAdminData>; actions: ReturnType<typeof useAdminActions> }) {
  const [specialties, setSpecialties] = useState<Record<string, string>>({});
  const [years, setYears] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  return <div className="space-y-4"><h2 className="text-2xl font-semibold">Solicitudes para enseñar</h2><p className="text-slate-400">Revisa las credenciales antes de habilitar el acceso de instructor.</p>{data.applications.data?.items.map((application) => <article key={application.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-5"><div><strong>{application.applicantName}</strong><p className="mt-1 font-mono text-xs font-semibold text-brand-300">Folio: {application.folio}</p><p className="mt-1 text-sm text-slate-400">{application.applicantEmail} · Matrícula: {application.enrollmentId}</p><p className="mt-2 text-sm">Comprobante: {application.credentialReference}</p></div>{application.status === "pending" ? <div className="mt-4 grid gap-3 md:grid-cols-3"><input value={specialties[application.id] ?? ""} onChange={(e) => setSpecialties((current) => ({ ...current, [application.id]: e.target.value }))} placeholder="Especialidad" className={inputClass} /><input type="number" min="0" value={years[application.id] ?? 0} onChange={(e) => setYears((current) => ({ ...current, [application.id]: Number(e.target.value) }))} aria-label="Años de experiencia" className={inputClass} /><input value={notes[application.id] ?? ""} onChange={(e) => setNotes((current) => ({ ...current, [application.id]: e.target.value }))} placeholder="Comentarios para el solicitante" className={inputClass} /><div className="flex flex-wrap gap-2 md:col-span-3"><Button size="sm" disabled={!specialties[application.id]} onClick={() => actions.resolveApplication.mutate({ applicationId: application.id, decision: "approved", specialty: specialties[application.id], experienceYears: years[application.id] ?? 0, observations: notes[application.id] })}>Aprobar</Button><Button size="sm" variant="secondary" onClick={() => actions.resolveApplication.mutate({ applicationId: application.id, decision: "rejected", observations: notes[application.id] })}>No aprobar</Button></div></div> : <p className="mt-3 text-sm font-semibold">{application.status === "approved" ? "Aprobada" : "No aprobada"}</p>}</article>)}</div>;
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [filters, setFilters] = useState<AdminFilters>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => {
      if (!["users", "courses", "categories"].includes(tab)) return current;
      const previous = current[tab];
      if ((previous && "search" in previous ? previous.search ?? "" : "") === search) return current;
      return { ...current, [tab]: { ...current[tab], search: search.trim() || undefined, page: 1 } };
    }), 300);
    return () => window.clearTimeout(timer);
  }, [search, tab]);
  const data = useAdminData(filters, tab);
  function filter(key: string, value: string | number) {
    setFilters((current) => ({ ...current, [tab]: { ...current[tab], [key]: value === "" ? undefined : value, ...(key === "page" ? {} : { page: 1 }) } }));
  }
  const list = data[tab];
  const values = filters[tab] ?? {};

  const actions = useAdminActions();
  const error = [data.users.error, data.instructors.error, data.courses.error, data.reviews.error, data.options.error, data.categories.error, data.applications.error].find(Boolean);
  const actionError = Object.values(actions).map((action) => action.error).find(Boolean);
  return <section aria-labelledby="admin-title" className="min-w-0"><p className="text-sm font-semibold text-brand-300">Panel administrativo</p><h1 id="admin-title" className="mt-2 text-3xl font-bold">Gestión de Academix</h1>
    <div role="tablist" aria-label="Secciones administrativas" className="my-8 flex flex-wrap gap-2">{(["users", "applications", "courses", "reviews", "categories"] as Tab[]).map((item) => <Button key={item} role="tab" aria-selected={tab === item} variant={tab === item ? "primary" : "secondary"} size="sm" onClick={() => { setTab(item); const previous = filters[item]; setSearch(previous && "search" in previous ? previous.search ?? "" : ""); }}>{{ users: "Usuarios", applications: "Solicitudes", courses: "Cursos", reviews: "Reseñas", categories: "Categorías" }[item]}</Button>)}</div>
    <div className="mb-5 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-3">
      {tab === "users" || tab === "courses" || tab === "categories" ? <label className="text-sm text-slate-300">Buscar<input type="search" aria-label="Buscar en la sección" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder={tab === "users" ? "Nombre o correo" : "Nombre o título"} /></label> : null}
      {tab === "users" ? <label className="text-sm text-slate-300">Rol<select aria-label="Filtrar por rol" value={filters.users?.role ?? ""} onChange={(event) => filter("role", event.target.value)} className={inputClass}><option value="">Todos los roles</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="institutional_administrator">Administrador institucional</option></select></label> : null}
      {tab === "users" || tab === "categories" ? <label className="text-sm text-slate-300">Estado<select aria-label="Filtrar por actividad" value={"active" in values ? values.active ?? "" : ""} onChange={(event) => filter("active", event.target.value)} className={inputClass}><option value="">Todos</option><option value="true">Activos</option><option value="false">Desactivados</option></select></label> : null}
      {tab === "courses" ? <><label className="text-sm text-slate-300">Tipo de curso<select aria-label="Tipo de curso" value={filters.courses?.scope ?? ""} onChange={(event) => filter("scope", event.target.value)} className={inputClass}><option value="">Todos</option><option value="external">Independientes</option><option value="institutional">Institucionales</option></select></label><label className="text-sm text-slate-300">Estado<select aria-label="Estado del curso" value={filters.courses?.status ?? ""} onChange={(event) => filter("status", event.target.value as CourseWorkflowStatus)} className={inputClass}><option value="">Todos</option>{Object.entries(courseStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></> : null}
      {tab === "applications" ? <label className="text-sm text-slate-300">Estado de solicitud<select aria-label="Estado de solicitud" value={filters.applications?.status ?? ""} onChange={(event) => filter("status", event.target.value as InstructorApplicationStatus)} className={inputClass}><option value="">Todas</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">No aprobadas</option></select></label> : null}
      {tab === "reviews" ? <label className="text-sm text-slate-300">Visibilidad<select aria-label="Visibilidad de reseñas" value={filters.reviews?.visibility ?? "all"} onChange={(event) => filter("visibility", event.target.value)} className={inputClass}><option value="all">Todas</option><option value="visible">Visibles</option><option value="hidden">Ocultas</option></select></label> : null}
    </div>
    {list.isPending ? <p role="status" className="mb-4 text-slate-400">Cargando registros...</p> : null}
    {list.data?.items.length === 0 ? <p className="mb-4 text-slate-400">No hay resultados con estos filtros.</p> : null}
    {error ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{userErrorMessage(error, "No pudimos cargar la administración. Intenta nuevamente.")}</p> : null}
    {actionError ? <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{userErrorMessage(actionError, "No pudimos completar la operación. Intenta nuevamente.")}</p> : null}
    {tab === "courses" ? <div className="my-4 rounded-xl border border-white/10 p-4"><label className="text-sm text-slate-300">Buscar instructor para asignar<input type="search" value={filters.instructors?.search ?? ""} onChange={(event) => setFilters((current) => ({ ...current, instructors: { ...current.instructors, search: event.target.value || undefined, page: 1 } }))} className={inputClass} /></label>{data.instructors.data ? <Pagination label="Instructores disponibles" pagination={data.instructors.data.pagination} isPending={data.instructors.isFetching} onPageChange={(page) => setFilters((current) => ({ ...current, instructors: { ...current.instructors, page } }))} /> : null}</div> : null}
    {tab === "users" ? <UsersPanel data={data} actions={actions} filters={filters.users ?? {}} onSort={(field) => setFilters((current) => ({ ...current, users: { ...current.users, page: 1, sort: field as UserListFilters["sort"], direction: current.users?.sort === field && current.users.direction === "asc" ? "desc" : "asc" } }))} /> : null}{tab === "applications" ? <ApplicationsPanel data={data} actions={actions} /> : null}{tab === "courses" ? <CoursesPanel data={data} actions={actions} /> : null}{tab === "reviews" ? <ReviewsPanel data={data} actions={actions} /> : null}{tab === "categories" ? <CategoriesPanel data={data} actions={actions} /> : null}
    {list.data ? <Pagination label="Registros administrativos" pagination={list.data.pagination} isPending={list.isFetching} onPageChange={(page) => filter("page", page)} onLimitChange={(limit) => filter("limit", limit)} /> : null}
  </section>;
}
