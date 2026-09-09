import { useMemo, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useOrganizationWorkspace, useOrganizations } from "../hooks/useOrganizations";
import type { OrganizationRole, OrganizationType } from "../types/organization.types";

const roleLabels: Record<OrganizationRole, string> = {
  administrator: "Administrador",
  instructor: "Instructor",
  student: "Estudiante",
};
const statusLabels = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado", moderated: "Dado de baja por moderación" } as const;

export default function OrganizationPage() {
  const organizations = useOrganizations();
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(
    () => organizations.data?.find((item) => item.id === selectedId) ?? organizations.data?.[0],
    [organizations.data, selectedId],
  );
  const workspace = useOrganizationWorkspace(selected?.id, selected?.role === "administrator");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OrganizationType>("university");
  const [joinCode, setJoinCode] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    const created = await workspace.create.mutateAsync({ name, description, type });
    setName("");
    setDescription("");
    if (created?.id) setSelectedId(created.id);
  }

  async function joinOrganization(event: FormEvent) {
    event.preventDefault();
    const joined = await workspace.join.mutateAsync({ code: joinCode, studentNumber });
    setJoinCode("");
    setStudentNumber("");
    if (joined?.id) setSelectedId(joined.id);
  }

  const isAdmin = selected?.role === "administrator";
  const canTeach = selected?.role === "administrator" || selected?.role === "instructor";
  const error = organizations.error ?? workspace.create.error ?? workspace.join.error ?? workspace.setRole.error;

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
            <select value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)} className="w-full max-w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 sm:w-auto">
              {organizations.data.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      {error ? <p role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error instanceof Error ? error.message : "No fue posible completar la operación."}</p> : null}

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
              {canTeach ? <div className="mt-5"><ButtonLink to={ROUTES.instructorPanel} size="sm">Gestionar cursos institucionales</ButtonLink></div> : null}
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Código de institución</p>
              {isAdmin && selected.joinCode ? <><p className="mt-3 font-mono text-xl font-bold tracking-widest text-brand-200">{selected.joinCode}</p><p className="mt-2 text-xs text-slate-400">El estudiante usa este código junto con su matrícula.</p></> : <p className="mt-3 text-sm text-slate-400">Solo los administradores pueden consultar este código.</p>}
            </article>
          </div>

          {isAdmin ? (
            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
              <section>
                <div className="mb-4"><h2 className="text-xl font-semibold text-slate-100">Usuarios de la organización</h2><p className="mt-1 text-sm text-slate-400">El administrador institucional puede nombrar instructores internos. Estos instructores no necesitan aprobación de Academix para impartir cursos de esta organización.</p></div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                  {workspace.members.isPending ? <p className="p-5 text-sm text-slate-400">Cargando miembros...</p> : workspace.members.data?.map((member) => (
                    <div key={member.userId} className="flex flex-col gap-3 border-b border-white/10 p-4 last:border-0 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-100">{member.fullName}</p><p className="truncate text-xs text-slate-500">{member.email}{member.studentNumber ? ` · Matrícula ${member.studentNumber}` : ""}</p></div>
                      <select aria-label={`Rol de ${member.fullName}`} value={member.role} onChange={(event) => workspace.setRole.mutate({ userId: member.userId, role: event.target.value as OrganizationRole })} disabled={workspace.setRole.isPending} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="student">Estudiante</option><option value="instructor">Instructor</option><option value="administrator">Administrador</option></select>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <div className="mb-4"><h2 className="text-xl font-semibold text-slate-100">Cursos institucionales</h2><p className="mt-1 text-sm text-slate-400">Todos los estudiantes activos de la organización acceden sin pago adicional a sus cursos publicados. Estos cursos están incluidos en el plan institucional y no tienen precio individual.</p></div>
                <div className="space-y-3">{workspace.courses.isPending ? <p className="text-sm text-slate-400">Cargando cursos...</p> : workspace.courses.data?.map((course) => <article key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><h3 className="font-semibold text-slate-100">{course.title}</h3><p className="mt-1 text-xs text-slate-500">{statusLabels[course.status]}{course.instructor ? ` · ${course.instructor.name}` : ""}</p></article>)}{workspace.courses.data?.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Aún no hay cursos vinculados a esta organización.</p> : null}</div>
              </section>
            </div>
          ) : (
            <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold text-slate-100">Acceso institucional activo</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Cuando un curso publicado pertenece a <strong className="text-slate-200">{selected.name}</strong>, tu membresía activa permite inscribirte sin pagar.</p></section>
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
