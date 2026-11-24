import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { api, userErrorMessage } from "../../services/api";
import { FormField } from "../auth/FormField";
import { Button } from "../ui/Button";

interface DeletionRequest { id: string; status: "pending" | "processing"; requestedAt: string; deleteAfter: string }
export function AccountDeletionPanel() {
  const { user } = useAuth(); const client = useQueryClient();
  const key = ["account-deletion", user?.id];
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const passwordRef = useRef("");
  const [notice, setNotice] = useState("");
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => api.get<DeletionRequest | null>("/users/me/deletion", { signal }), enabled: Boolean(user), staleTime: 0 });
  const request = useMutation({
    mutationFn: () => api.post<DeletionRequest>("/users/me/deletion", { password: passwordRef.current, confirmation: "ELIMINAR MI CUENTA" }),
    onSuccess: (data) => { client.setQueryData(key, data); setConfirming(false); setNotice("Tu solicitud quedó registrada. Puedes cancelarla antes de la fecha indicada."); },
    onSettled: () => { passwordRef.current = ""; setPassword(""); setConfirmation(""); },
  });
  const cancel = useMutation({
    mutationFn: () => api.delete("/users/me/deletion"),
    onSuccess: () => { client.setQueryData(key, null); setNotice("La eliminación fue cancelada. Tu cuenta continúa activa."); },
  });
  function submit(event: FormEvent) { event.preventDefault(); request.mutate(); }
  const busy = request.isPending || cancel.isPending;
  const error = query.error || request.error || cancel.error;
  return (
    <section aria-labelledby="delete-account-heading" className="mt-8 rounded-2xl border border-red-400/30 bg-slate-900 p-6 sm:p-8">
      <h2 id="delete-account-heading" className="text-xl font-bold text-white">Eliminar mi cuenta</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">Esta acción inicia un periodo de 10 días. Después se eliminarán permanentemente tu cuenta y los datos personales que correspondan. Las organizaciones y los recursos compartidos requieren resolver su titularidad antes de continuar.</p>
      {query.isPending ? <p role="status" className="mt-4 text-sm text-slate-300">Consultando el estado de tu cuenta…</p> : null}
      {error ? <div role="alert" className="mt-4 text-sm text-red-200">{userErrorMessage(error, "No pudimos consultar o actualizar la solicitud de eliminación.")}{query.isError ? <Button className="ml-3" onClick={() => void query.refetch()}>Reintentar</Button> : null}</div> : null}
      {notice ? <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p> : null}
      {query.data ? <div className="mt-5 rounded-xl border border-red-400/20 p-4">
        <p className="text-sm text-white">Eliminación programada: <time dateTime={query.data.deleteAfter}>{new Date(query.data.deleteAfter).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "long" })}</time>.</p>
        <p className="mt-2 text-sm text-slate-300">Puedes cancelar hasta ese instante. El servidor verifica el plazo al recibir la solicitud.</p>
        {query.data.status === "pending" ? <Button disabled={busy} className="mt-4" onClick={() => { cancel.reset(); request.reset(); cancel.mutate(); }}>{cancel.isPending ? "Cancelando…" : "Cancelar eliminación"}</Button> : <p role="status" className="mt-3 text-sm text-red-200">La eliminación ya está en proceso.</p>}
      </div> : null}
      {!query.isPending && !query.isError && !query.data && !confirming ? <Button className="mt-5" onClick={() => { setNotice(""); request.reset(); cancel.reset(); setConfirming(true); }}>Eliminar mi cuenta</Button> : null}
      {confirming && !query.data ? <form onSubmit={submit} className="mt-5 max-w-xl space-y-4">
        <p className="text-sm font-semibold text-red-200">¿Estás seguro? Tendrás 10 días para cancelar antes de la eliminación permanente.</p>
        <FormField label="Contraseña actual" type="password" autoComplete="current-password" required maxLength={1024} value={password} disabled={busy} onChange={(event) => { passwordRef.current = event.target.value; setPassword(event.target.value); }} />
        <FormField label="Escribe ELIMINAR MI CUENTA" autoComplete="off" required value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} />
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !password || confirmation !== "ELIMINAR MI CUENTA"}>{request.isPending ? "Registrando…" : "Confirmar eliminación"}</Button><Button disabled={busy} onClick={() => { setConfirming(false); passwordRef.current = ""; setPassword(""); setConfirmation(""); request.reset(); }}>Conservar mi cuenta</Button></div>
      </form> : null}
    </section>
  );
}
