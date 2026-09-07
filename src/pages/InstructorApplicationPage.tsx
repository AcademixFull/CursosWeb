import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { roleHomeRoute, ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { managementService } from "../services/management.service";

const labels = { pending: "Pendiente de revisión", approved: "Aprobada", rejected: "No aprobada" } as const;

export default function InstructorApplicationPage() {
  const [enrollmentId, setEnrollmentId] = useState("");
  const [credentialReference, setCredentialReference] = useState("");
  const client = useQueryClient();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const alreadyInstructor = user?.role === "instructor";
  const isAdmin = user?.role === "admin";
  const application = useQuery({
    queryKey: ["instructor-application"],
    queryFn: managementService.getMyInstructorApplication,
    enabled: !alreadyInstructor && !isAdmin,
  });
  const submit = useMutation({
    mutationFn: managementService.submitInstructorApplication,
    onSuccess: () => client.invalidateQueries({ queryKey: ["instructor-application"] }),
  });

  async function updateAccess() {
    const user = await refreshUser();
    navigate(roleHomeRoute(user.role), { replace: true });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit.mutate({ enrollmentId, credentialReference });
  }

  const current = application.data;

  if (alreadyInstructor || isAdmin) {
    return (
      <section aria-labelledby="application-title" className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-300">Comparte lo que sabes</p>
        <h1 id="application-title" className="mt-2 text-3xl font-bold">
          {alreadyInstructor ? "Ya eres instructor de Academix" : "Tu cuenta ya tiene acceso administrativo"}
        </h1>
        <div className="mt-7 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
          <p className="font-semibold text-emerald-100">
            {alreadyInstructor
              ? "No necesitas enviar otra solicitud. Tu acceso de instructor ya está activo."
              : "Como administrador de Academix no necesitas enviar una solicitud para enseñar."}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            También puedes inscribirte, comprar y completar cursos de otros instructores desde el catálogo como cualquier usuario de Academix.
          </p>
          <Button
            className="mt-5"
            onClick={() => navigate(alreadyInstructor ? ROUTES.instructorPanel : ROUTES.admin)}
          >
            {alreadyInstructor ? "Ir a mi panel de instructor" : "Volver a administración"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="application-title" className="max-w-2xl">
      <p className="text-sm font-semibold text-brand-300">Comparte lo que sabes</p>
      <h1 id="application-title" className="mt-2 text-3xl font-bold">Solicitud para enseñar en Academix</h1>
      <p className="mt-3 text-slate-400">Envíanos tus datos académicos. Un administrador revisará la solicitud antes de habilitar tu espacio de instructor.</p>
      {application.isPending ? <p className="mt-6">Consultando tu solicitud...</p> : null}
      {current ? <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Estado</p><p className="mt-1 text-xl font-semibold">{labels[current.status]}</p>
        {current.observations ? <p className="mt-3 text-slate-300">Comentarios: {current.observations}</p> : null}
        {current.status === "approved" ? <Button onClick={updateAccess} className="mt-5">Entrar a mi panel de instructor</Button> : null}
      </div> : <form onSubmit={handleSubmit} className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <label className="block"><span className="mb-2 block text-sm font-semibold">Matrícula o identificador académico</span><input required minLength={3} maxLength={40} value={enrollmentId} onChange={(event) => setEnrollmentId(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold">Folio o enlace de tu comprobante</span><input required minLength={5} maxLength={500} value={credentialReference} onChange={(event) => setCredentialReference(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3" /></label>
        <Button type="submit" disabled={submit.isPending}>{submit.isPending ? "Enviando..." : "Enviar solicitud"}</Button>
        {submit.error ? <p role="alert" className="text-sm text-red-300">{submit.error instanceof Error ? submit.error.message : "No se pudo enviar la solicitud."}</p> : null}
      </form>}
    </section>
  );
}
