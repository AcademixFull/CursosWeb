import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { env } from "../../config/env";
import { downloadLibrary, type DownloadState } from "../../offline/downloads";
import { canSync, syncOfflineProgress } from "../../offline/learning";
import { OFFLINE_CHANGED, offlineStore } from "../../offline/store";
import { listOfflineRequests, syncOfflineRequests } from "../../offline/requests";
import { listCourses, listFeaturedCourses } from "../../services/courses.service";
import { subscriptionService } from "../../services/subscription.service";
import { listCategories } from "../../services/categories.service";
import { listMyCourses } from "../../services/student.service";
import { userErrorMessage } from "../../services/api";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaStatus() {
  const { user, session, isInitializing } = useAuth();
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(navigator.onLine);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.("(display-mode: standalone)").matches ?? false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [downloads, setDownloads] = useState<DownloadState[]>([]);
  const [shellReady, setShellReady] = useState(!import.meta.env.PROD);
  const userId = user?.id;
  const [confirmedUser, setConfirmedUser] = useState<string>();
  const [requestState, setRequestState] = useState<{ user: string; items: Awaited<ReturnType<typeof listOfflineRequests>> }>();
  const requests = requestState?.user === userId ? requestState?.items ?? [] : [];
  useEffect(() => {
    if (!online || !import.meta.env.PROD || env.dataSource !== "api") return;
    void Promise.allSettled([
      queryClient.prefetchQuery({ queryKey: ["courses", "featured"], queryFn: () => listFeaturedCourses() }),
      queryClient.prefetchQuery({ queryKey: ["categories"], queryFn: () => listCategories() }),
      listCourses(),
      queryClient.prefetchQuery({ queryKey: ["plans"], queryFn: subscriptionService.plans }),
    ]);
  }, [online, queryClient]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const refresh = () => {
      void listOfflineRequests(userId).then((value) => { if (!cancelled) setRequestState({ user: userId, items: value }); }).catch(() => undefined);
    };
    refresh();
    window.addEventListener(OFFLINE_CHANGED, refresh);
    return () => { cancelled = true; window.removeEventListener(OFFLINE_CHANGED, refresh); };
  }, [userId]);
  const preparing = useRef(false);
  const requested = useRef(false);

  useEffect(() => {
    const connected = () => setOnline(navigator.onLine);
    const prompted = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const completed = () => { setInstalled(true); setInstall(null); };
    window.addEventListener("online", connected); window.addEventListener("offline", connected);
    window.addEventListener("beforeinstallprompt", prompted); window.addEventListener("appinstalled", completed);
    return () => {
      window.removeEventListener("online", connected); window.removeEventListener("offline", connected);
      window.removeEventListener("beforeinstallprompt", prompted); window.removeEventListener("appinstalled", completed);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const failed = () => setMessage("No se pudo preparar la aplicación sin conexión. Mantén internet y vuelve a abrirla para reintentar.");
    window.addEventListener("academix:pwa-error", failed);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.ready.then(() => setShellReady(true));
    else failed();
    return () => window.removeEventListener("academix:pwa-error", failed);
  }, []);

  useEffect(() => {
    const synced = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== userId) return;
      void queryClient.invalidateQueries({ queryKey: ["student", userId] });
      void queryClient.invalidateQueries({ queryKey: ["learning", userId] });
      setMessage("Avance sincronizado. Revisa Certificados si completaste el curso.");
    };
    window.addEventListener("academix:offline-synced", synced);
    return () => window.removeEventListener("academix:offline-synced", synced);
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId || typeof indexedDB === "undefined") return;
    let cancelled = false;
    const update = () => {
      void Promise.all([offlineStore.list<{error?: string}>(userId, "pending"), offlineStore.list<DownloadState>(userId, "download")])
        .then(([queue, states]) => { if (!cancelled) { setPending(queue.length); setRejected(queue.filter((p) => p.error).length); setDownloads(states); } })
        .catch(() => { if (!cancelled) setMessage("No se pudo guardar contenido en este dispositivo. Revisa el espacio y los permisos del navegador."); });
    };
    update(); window.addEventListener(OFFLINE_CHANGED, update);
    return () => { cancelled = true; window.removeEventListener(OFFLINE_CHANGED, update); };
  }, [userId]);

  const prepare = useCallback(async (refresh = false, includeDownloads = true) => {
    if (!userId || !canSync(userId) || env.dataSource !== "api") return;
    if (preparing.current) { if (includeDownloads) requested.current = true; return; }
    const revision = offlineStore.generation(userId);
    preparing.current = true;
    setBusy(true); setMessage("");
    try {
      if (refresh) await navigator.storage?.persist?.();
      let syncError = "";
      let synced = 0;
      try {
        const confirmed = await syncOfflineRequests(userId);
        if (confirmed) {
          setConfirmedUser(userId);
          includeDownloads = true;
          for (const key of ["subscriptions", "organizations", "student"]) {
            void queryClient.invalidateQueries({ queryKey: [key] });
          }
        }
        synced = await syncOfflineProgress(userId, refresh);
      }
      catch (error) { syncError = userErrorMessage(error, "No se pudo sincronizar el avance. Se conserva en este dispositivo."); }
      if (synced) {
        await queryClient.invalidateQueries({ queryKey: ["student", userId] });
        await queryClient.invalidateQueries({ queryKey: ["learning", userId] });
      }
      if (includeDownloads || requested.current) {
        do {
          requested.current = false;
          const library = await listMyCourses();
          if (!canSync(userId) || offlineStore.generation(userId) !== revision) return;
          await downloadLibrary(userId, library, refresh);
        } while (requested.current && canSync(userId));
      }
      if (syncError) setMessage(syncError);
      else if (synced) setMessage("Avance sincronizado. Si completaste el curso, tu certificado está en Certificados.");
      else if (includeDownloads) setMessage("Descarga terminada. Revisa el estado de cada curso en Mis cursos.");
    } catch (error) { setMessage(userErrorMessage(error, "No se pudo terminar la descarga. Revisa tu conexión y el espacio disponible.")); }
    finally { preparing.current = false; setBusy(false); }
  }, [queryClient, userId]);

  useEffect(() => {
    if (!online || isInitializing || !session?.accessToken) return;
    // Sequential periodic retries cover intermittent connections and expired sessions.
    let running = false;
    const run = async (includeDownloads = false) => {
      if (running) return;
      running = true;
      try { await prepare(false, includeDownloads); } finally { running = false; }
    };
    void run(true);
    const interval = window.setInterval(() => { void run(); }, 60_000);
    const enrolled = () => { void prepare(); };
    window.addEventListener("academix:enrolled", enrolled);
    return () => { window.clearInterval(interval); window.removeEventListener("academix:enrolled", enrolled); };
  }, [online, isInitializing, prepare, session?.accessToken]);

  async function installApp() {
    if (!install) {
      setMessage("Para instalar: abre el menú de tu navegador y elige Instalar aplicación o Agregar a pantalla de inicio. En Safari usa Compartir → Agregar a inicio.");
      return;
    }
    try { await install.prompt(); await install.userChoice; setInstall(null); }
    catch { setMessage("Abre el menú del navegador para instalar Academix."); }
  }

  async function removeDownloads() {
    if (!userId) return;
    if (!await offlineStore.clearDownloads(userId)) {
      setMessage("Sincroniza tu avance antes de borrar las descargas."); return;
    }
    setMessage("Descargas de esta cuenta eliminadas del dispositivo.");
  }

  const needsLogin = user && online && !session?.accessToken;
  const ready = downloads.filter((d) => d.status === "ready").length;
  return (
    <>
    {userId && (requests.length || confirmedUser === userId) ? <div role="status" className="mx-auto max-w-7xl px-4 py-2 text-sm">
      {confirmedUser === userId ? <p>Academix confirmó las solicitudes sincronizadas.</p> : null}
      {requests.some((entry) => !entry.error) ? <p>Solicitudes pendientes. Se enviarán al recuperar la conexión con tu cuenta abierta.</p> : null}
      {requests.filter((entry) => entry.error).map((entry) => <p key={entry.id}>No se confirmó una solicitud: {entry.error}</p>)}
    </div> : null}
    <aside hidden aria-label="Aplicación y conexión" className="print-hidden border-b border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        {!installed ? <button type="button" onClick={() => void installApp()} className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white">Instalar Academix</button> : null}
        <span role="status">{online ? "Con conexión" : "Sin conexión · puedes estudiar los cursos descargados"}
          {user ? ` · ${pending} cambios pendientes · ${ready} cursos listos sin internet` : ""}</span>
        {user && env.dataSource === "api" ? <>
          <button type="button" disabled={busy || !online || Boolean(needsLogin)} onClick={() => void prepare(true)} className="rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-50">
            {busy ? "Preparando cursos..." : "Sincronizar y actualizar descargas"}
          </button>
          <button type="button" disabled={busy} onClick={() => { void removeDownloads().catch(() => setMessage("No se pudieron borrar las descargas.")); }} className="underline disabled:opacity-50">Borrar descargas</button>
        </> : null}
        {needsLogin ? <a href="#/iniciar-sesion" className="font-bold text-brand-300">Inicia sesión para sincronizar y obtener tu certificado</a> : null}
        {rejected ? <p role="alert" className="w-full text-amber-200">{rejected} cambios no pudieron validarse: una lección o inscripción ya no está disponible. Los conservamos; puedes reintentar con Sincronizar y actualizar descargas.</p> : null}
        {!shellReady ? <p className="w-full text-amber-200">Preparando la aplicación para abrir sin internet. Mantén la conexión hasta que termine.</p> : null}
        {message ? <p role="status" className="w-full text-slate-300">{message}</p> : null}
      </div>
    </aside>
    </>
  );
}
