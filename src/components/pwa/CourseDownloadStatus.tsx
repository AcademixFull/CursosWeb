import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { type DownloadState } from "../../offline/downloads";
import { OFFLINE_CHANGED, offlineStore } from "../../offline/store";

export function CourseDownloadStatus({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<DownloadState>();
  useEffect(() => {
    if (!user || typeof indexedDB === "undefined") return;
    let cancelled = false;
    const update = () => {
      void offlineStore.get<DownloadState>(user.id, "download", courseId)
        .then((value) => { if (!cancelled) setState(value); }).catch(() => undefined);
    };
    update(); window.addEventListener(OFFLINE_CHANGED, update);
    return () => { cancelled = true; window.removeEventListener(OFFLINE_CHANGED, update); };
  }, [courseId, user]);
  return <p role="status" className="mt-3 text-xs text-brand-300">
    {!state ? "Pendiente de descarga para estudiar sin conexión."
      : state.status === "ready" ? "Disponible sin conexión · lecciones y archivos guardados."
      : state.status === "partial" ? `Lecciones y archivos guardados. ${state.externalResources} recursos externos necesitan internet.`
      : state.status === "downloading" ? `Descargando archivos: ${state.savedFiles} de ${state.totalFiles}.`
      : "Descarga incompleta. Usa Sincronizar y actualizar descargas para reintentar."}
  </p>;
}
