import { useEffect, useState } from "react";
import { PWA_UPDATE_AVAILABLE, waitingPwaUpdate } from "../../offline/register";

export function PwaUpdateNotice() {
  const [available, setAvailable] = useState(Boolean(waitingPwaUpdate()));
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const announce = () => setAvailable(true);
    window.addEventListener(PWA_UPDATE_AVAILABLE, announce);
    if (!("serviceWorker" in navigator)) return () => window.removeEventListener(PWA_UPDATE_AVAILABLE, announce);
    const message = (event: MessageEvent) => {
      if (event.data?.type === "ACADEMIX_UPDATE_BLOCKED") setBlocked(true);
    };
    navigator.serviceWorker.addEventListener("message", message);
    return () => {
      window.removeEventListener(PWA_UPDATE_AVAILABLE, announce);
      navigator.serviceWorker.removeEventListener("message", message);
    };
  }, []);
  if (!available) return null;
  function update() {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waitingPwaUpdate()?.waiting?.postMessage({ type: "ACADEMIX_ACTIVATE_UPDATE" });
  }
  return <aside role="status" aria-label="Actualización disponible" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-violet-400/50 bg-slate-950 p-5 text-white shadow-2xl">
    <p className="font-semibold">Hay una nueva versión de Academix</p>
    <p className="mt-2 text-sm text-slate-300">{blocked ? "Cierra las otras ventanas de Academix y vuelve a intentarlo." : "Se recargará esta página. Tu avance guardado se conserva."}</p>
    <button type="button" onClick={update} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">Actualizar ahora</button>
  </aside>;
}
