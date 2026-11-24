import { Pagination } from "../components/ui/Pagination";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "../services/organization.service";
import { ConfirmationDialog } from "../components/ui/ConfirmationDialog";
import { SubscriptionPanel } from "../components/subscription/SubscriptionPanel";
import { PageLoader } from "../components/ui/PageLoader";
import { ErrorState } from "../components/ui/ErrorState";
import type { ManagedCourseFilters, CourseWorkflowStatus } from "../types/management.types";
import { DataTable } from "../components/ui/DataTable";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useMemo, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useOrganizationWorkspace, useOrganizations } from "../hooks/useOrganizations";
import { userErrorMessage } from "../services/api";
import type { OrganizationRole, OrganizationType, OrganizationMemberFilters } from "../types/organization.types";

const roleLabels: Record<OrganizationRole, string> = {
  administrator: "Administrador institucional",
  instructor: "Instructor",
  student: "Estudiante",
};
const statusLabels = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado", moderated: "Dado de baja por moderación" } as const;

export default function OrganizationPage() {
  const organizations = useOrganizations();
  const client = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [roleChange, setRoleChange] = useState<{ userId: string; fullName: string; role: OrganizationRole } | null>(null);
  const remove = useMutation({ mutationFn: organizationService.remove, onSuccess: async () => {
    setConfirmDelete(false); setSelectedId("");
    await Promise.all(["organizations", "subscriptions", "student", "management"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  } });
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(
    () => organizations.data?.find((item) => item.id === selectedId) ?? organizations.data?.[0],
    [organizations.data, selectedId],
  );
  const [memberFilters, setMemberFilters] = useState<OrganizationMemberFilters>({ page: 1, limit: 20, sort: "joinedAt", direction: "asc" });
  const [courseFilters, setCourseFilters] = useState<ManagedCourseFilters>({ page: 1, limit: 20 });
  const memberSearch = useDebouncedValue(memberFilters.search);
  const courseSearch = useDebouncedValue(courseFilters.search);
  const workspace = useOrganizationWorkspace(selected?.id, selected?.role === "administrator", { ...memberFilters, search: memberSearch }, { ...courseFilters, search: courseSearch });
  function selectOrganization(id: string) {
    setSelectedId(id);
    setMemberFilters({ page: 1, limit: 20 });
    setCourseFilters({ page: 1, limit: 20 });
  }
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OrganizationType>("university");
  const [joinCode, setJoinCode] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    const created = await workspace.create.mutateAsync({ name, description, type }).catch(() => null);
    setName("");
    setDescription("");
    if (created?.id) selectOrganization(created.id);
  }

  async function joinOrganization(event: FormEvent) {
    event.preventDefault();
    const joined = await workspace.join.mutateAsync({ code: joinCode, studentNumber }).catch(() => null);
    setJoinCode("");
    setStudentNumber("");
    if (joined?.id) selectOrganization(joined.id);
  }

  const isAdmin = selected?.role === "administrator";
  const canTeach = selected?.capabilities?.canManageCourses ?? false;
  const error = organizations.error ?? workspace.create.error ?? workspace.join.error ?? workspace.setRole.error ?? workspace.members.error ?? workspace.courses.error ?? workspace.assignInstructor.error;

  const joinFields = (
    <div className="space-y-4">
      <label className="block text-sm text-slate-300">
        Código de organización
        <input required value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="EJ. A1B2C3D4" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono uppercase tracking-widest text-slate-100" />
      </label>
      <label className="block text-sm text-slate-300">
        Matrícula
        <input required minLength={2} maxLength={80} value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="Tu matrícula institucional" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100" />
      </label>
    </div>
  );

  if (organizations.isPending) return <PageLoader label="Consultando tus organizaciones" />;
  if (organizations.isError) return <ErrorState title="No pudimos consultar tus organizaciones" description={userErrorMessage(organizations.error)} onRetry={() => void organizations.refetch()} />;

  return (
    <section aria-labelledby="organization-title" className="min-w-0">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-300">Organizaciones</p>
          <h1 id="organization-title" className="mt-2 text-3xl font-bold text-slate-100">Mis organizaciones</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Puedes pertenecer a varias organizaciones al mismo tiempo. Crea el espacio de tu universidad o empresa, o únete con el código de cada institución y tu matrícula.</p>
        </div>
        {organizations.data && organizations.data.length > 0 ? (
          <label className="flex w-full flex-col gap-2 text-sm text-slate-400 sm:w-auto sm:flex-row sm:items-center">Organización
            <select value={selected?.id ?? ""} onChange={(event) => selectOrganization(event.target.value)} className="w-full max-w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 sm:w-auto">
              {organizations.data.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      {error ? <p role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{userErrorMessage(error, "No pudimos completar la operación. Intenta nuevamente.")}</p> : null}

      {!selected ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createOrganization} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Crear una organización</h2>
            <p className="mt-2 text-sm text-slate-400">La persona que la crea se convierte en su primer administrador institucional.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-300">Nombre<input required minLength={3} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100" /></label>
              <label className="block text-sm text-slate-300">Tipo<select value={type} onChange={(event) => setType(event.target.value as OrganizationType)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100"><option value="university">Universidad</option><option value="company">Empresa</option><option value="other">Otra</option></select></label>
              <label className="block text-sm text-slate-300">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100" /></label>
            </div>
            <Button type="submit" className="mt-5" disabled={workspace.create.isPending}>{workspace.create.isPending ? "Creando..." : "Crear organización"}</Button>
          </form>
          <form onSubmit={joinOrganization} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Unirme a una organización</h2>
            <p className="mt-2 text-sm text-slate-400">Tu matrícula queda vinculada a tu cuenta dentro de esa institución. Entrarás inicialmente como estudiante.</p>
            <div className="mt-6">{joinFields}</div>
            <Button type="submit" className="mt-5" variant="secondary" disabled={workspace.join.isPending}>{workspace.join.isPending ? "Uniéndome..." : "Unirme"}</Button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-brand-400/25 bg-brand-500/10 p-5 lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-300">{selected.type === "university" ? "Universidad" : selected.type === "company" ? "Empresa" : "Organización"}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-100">{selected.name}</h2>
              <p className="mt-2 text-sm text-slate-400">{selected.description || "Sin descripción todavía."}</p>
              <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Tu rol: {roleLabels[selected.role]}</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{selected.memberCount} miembros</span></div>
              <p className="mt-3 text-sm text-slate-300">{selected.isOwner ? "Eres propietario de esta organización. " : ""}{selected.active === false ? "Organización inactiva." : selected.subscription?.active ? "Suscripción vigente." : "Sin suscripción vigente: puedes consultar el espacio y conservar tu rol. Activa el plan para habilitar los cursos institucionales."}</p>
              {selected.subscription?.startsAt ? <p className="mt-2 text-xs text-slate-400">Activación: {new Date(selected.subscription.startsAt).toLocaleString("es-MX")} · Vencimiento: {selected.subscription.endsAt ? new Date(selected.subscription.endsAt).toLocaleString("es-MX") : "—"}</p> : null}
              {canTeach ? <div className="mt-5"><ButtonLink to={`${ROUTES.instructorPanel}?organizationId=${encodeURIComponent(selected.id)}`} size="sm">Gestionar cursos institucionales</ButtonLink></div> : null}
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Código de institución</p>
              {isAdmin && selected.joinCode ? <><p className="mt-3 font-mono text-xl font-bold tracking-widest text-brand-200">{selected.joinCode}</p><p className="mt-2 text-xs text-slate-400">El estudiante usa este código junto con su matrícula.</p></> : <p className="mt-3 text-sm text-slate-400">Solo los administradores pueden consultar este código.</p>}
            </article>
          </div>

          {isAdmin ? <SubscriptionPanel organizationId={selected.id} canPurchase={selected.active !== false} /> : null}
          {selected.capabilities?.canDelete ? <div className="mt-5"><Button variant="danger" onClick={() => { remove.reset(); setConfirmDelete(true); }}>Eliminar organización</Button></div> : null}
          <ConfirmationDialog open={confirmDelete} title={`Eliminar ${selected.name}`} danger pending={remove.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate(selected.id)} confirmLabel="Eliminar organización">
            <p>Se archivará el espacio institucional y sus cursos. Los miembros perderán el acceso institucional y la suscripción quedará cancelada.</p><p>Se conservarán las cuentas de los miembros, materiales, avances y certificados. No se eliminarán cursos ni datos de otras organizaciones o usuarios.</p>
            {remove.error ? <p role="alert" className="text-red-300">{userErrorMessage(remove.error)}</p> : null}
          </ConfirmationDialog>

          {isAdmin ? (
            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
              <section>
                <div className="mb-4"><h2 className="text-xl font-semibold text-slate-100">Usuarios de la organización</h2><p className="mt-1 text-sm text-slate-400">El administrador institucional puede nombrar a otros administradores institucionales e instructores internos. Estos permisos solo aplican a esta organización. Estos instructores no necesitan aprobación de Academix para impartir cursos de esta organización.</p></div>
                <div className="mb-3 flex flex-wrap gap-2"><input type="search" aria-label="Buscar miembros" placeholder="Nombre, correo o matrícula" value={memberFilters.search ?? ""} onChange={(event) => setMemberFilters((current) => ({ ...current, search: event.target.value || undefined, page: 1 }))} className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><select aria-label="Filtrar rol institucional" value={memberFilters.role ?? ""} onChange={(event) => setMemberFilters((current) => ({ ...current, role: event.target.value as OrganizationRole || undefined, page: 1 }))} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="">Todos los roles</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <label className="mb-3 block text-sm text-slate-400">Estado <select aria-label="Filtrar estado de miembros" value={memberFilters.active ?? ""} onChange={(event) => setMemberFilters((current) => ({ ...current, active: event.target.value as "true" | "false" || undefined, page: 1 }))} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label>
                {workspace.members.isPending ? <p role="status" className="p-5 text-sm text-slate-400">Cargando miembros...</p> : <DataTable caption="Miembros de la organización" rows={workspace.members.data?.items ?? []} rowKey={(member) => member.userId} sort={memberFilters.sort} direction={memberFilters.direction} onSort={(field) => setMemberFilters((current) => ({ ...current, sort: field as OrganizationMemberFilters["sort"], direction: current.sort === field && current.direction === "asc" ? "desc" : "asc", page: 1 }))} columns={[
                  { key: "name", label: "Nombre", sort: "name", render: (member) => <span className="font-medium text-slate-100">{member.fullName}</span> },
                  { key: "email", label: "Correo y matrícula", sort: "email", render: (member) => <><p className="break-all text-slate-300">{member.email}</p><p className="text-xs text-slate-400">{member.studentNumber ?? "Sin matrícula"}</p></> },
                  { key: "state", label: "Estado", render: (member) => <span className={member.active ? "text-emerald-300" : "text-slate-400"}>{member.active ? "Activo" : "Inactivo"}</span> },
                  { key: "role", label: "Rol institucional", render: (member) => <select aria-label={`Rol de ${member.fullName}`} value={member.role} onChange={(event) => setRoleChange({ userId: member.userId, fullName: member.fullName, role: event.target.value as OrganizationRole })} disabled={workspace.setRole.isPending || !member.active || selected.capabilities?.canManageMembers === false} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="student">Estudiante</option><option value="instructor">Instructor</option><option value="administrator">Administrador institucional</option></select> },
                ]} />}
                <ConfirmationDialog open={Boolean(roleChange)} title="Cambiar rol institucional" pending={workspace.setRole.isPending} onCancel={() => setRoleChange(null)} onConfirm={() => { if (roleChange) void workspace.setRole.mutateAsync({ userId: roleChange.userId, role: roleChange.role }).then(() => setRoleChange(null)).catch(() => undefined); }} confirmLabel="Guardar rol">
                  <p>{roleChange?.fullName} tendrá el rol {roleChange ? roleLabels[roleChange.role] : ""}. Sus permisos cambiarán únicamente dentro de esta organización.</p>
                  {workspace.setRole.error ? <p role="alert" className="text-red-300">{userErrorMessage(workspace.setRole.error)}</p> : null}
                </ConfirmationDialog>
                {workspace.members.data?.items.length === 0 ? <p className="mt-3 text-sm text-slate-400">No hay miembros con estos filtros.</p> : null}
                {workspace.members.data ? <Pagination label="Miembros institucionales" pagination={workspace.members.data.pagination} isPending={workspace.members.isFetching} onPageChange={(page) => setMemberFilters((current) => ({ ...current, page }))} onLimitChange={(limit) => setMemberFilters((current) => ({ ...current, limit, page: 1 }))} /> : null}
              </section>
              <section>
                <div className="mb-4"><h2 className="text-xl font-semibold text-slate-100">Cursos institucionales</h2><p className="mt-1 text-sm text-slate-400">Durante la vigencia del plan, los estudiantes activos acceden sin pago adicional a los cursos publicados de la organización.</p></div>
                <div className="mb-3 flex flex-wrap gap-2"><input type="search" aria-label="Buscar cursos institucionales" placeholder="Título de curso" value={courseFilters.search ?? ""} onChange={(event) => setCourseFilters((current) => ({ ...current, search: event.target.value || undefined, page: 1 }))} className="min-w-0 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><select aria-label="Estado institucional" value={courseFilters.status ?? ""} onChange={(event) => setCourseFilters((current) => ({ ...current, status: event.target.value as CourseWorkflowStatus || undefined, page: 1 }))} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <p className="mb-3 text-xs text-slate-400">Para asignar un instructor, búscalo en la lista de miembros y selecciona su nombre en el curso.</p>
                <div className="space-y-3">{workspace.courses.isPending ? <p className="text-sm text-slate-400">Cargando cursos...</p> : workspace.courses.data?.items.map((course) => <article key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><h3 className="font-semibold text-slate-100">{course.title}</h3><p className="mt-1 text-xs text-slate-500">{statusLabels[course.status]}{course.instructor ? ` · ${course.instructor.name}` : ""}</p>{course.active ? <label className="mt-3 block text-xs text-slate-300">Instructor principal<select aria-label={`Instructor institucional de ${course.title}`} value={course.instructor?.id ?? ""} disabled={workspace.assignInstructor.isPending} onChange={(event) => event.target.value && workspace.assignInstructor.mutate({ courseId: course.id, instructorId: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="">Seleccionar instructor</option>{course.instructor && !workspace.members.data?.items.some((member) => member.userId === course.instructor?.id) ? <option value={course.instructor.id}>{course.instructor.name}</option> : null}{workspace.members.data?.items.filter((member) => member.active && member.role !== "student").map((member) => <option key={member.userId} value={member.userId}>{member.fullName}</option>)}</select></label> : null}</article>)}{workspace.courses.data?.items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Aún no hay cursos vinculados a esta organización.</p> : null}</div>
                {workspace.courses.data ? <Pagination label="Cursos institucionales" pagination={workspace.courses.data.pagination} isPending={workspace.courses.isFetching} onPageChange={(page) => setCourseFilters((current) => ({ ...current, page }))} onLimitChange={(limit) => setCourseFilters((current) => ({ ...current, limit, page: 1 }))} /> : null}
              </section>
            </div>
          ) : (
            <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold text-slate-100">Acceso institucional {selected.subscription?.active ? "activo" : "pendiente de activación"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">La membresía activa y la suscripción vigente permiten estudiar los cursos publicados de <strong className="text-slate-200">{selected.name}</strong> sin un cobro individual.</p></section>
          )}

          <details className="mt-8 rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <summary className="font-semibold text-slate-200">Crear otra organización o unirme a otra institución</summary>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <form onSubmit={createOrganization} className="space-y-3"><input required minLength={3} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre de la organización" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100" /><select value={type} onChange={(event) => setType(event.target.value as OrganizationType)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100"><option value="university">Universidad</option><option value="company">Empresa</option><option value="other">Otra</option></select><Button type="submit" disabled={workspace.create.isPending}>Crear</Button></form>
              <form onSubmit={joinOrganization} className="space-y-3">{joinFields}<Button type="submit" variant="secondary" disabled={workspace.join.isPending}>Unirme</Button></form>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
