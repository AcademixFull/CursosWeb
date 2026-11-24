import { useEffect, useRef, useState } from "react";
import { getLearningResourceContent } from "../../services/learning.service";
import { userErrorMessage } from "../../services/api";
import type { LearningResource } from "../../types/learning.types";
import { Button } from "../ui/Button";

interface ProtectedResourceProps {
  resource: LearningResource;
}

function safeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function ResourcePreview({ resource, url, contentType, fileName }: {
  resource: LearningResource;
  url: string;
  contentType: string;
  fileName?: string;
}) {
  if (contentType.startsWith("video/")) {
    return <video controls src={url} className="mt-4 w-full rounded-xl bg-black" />;
  }
  if (contentType.startsWith("audio/")) {
    return <audio controls src={url} className="mt-4 w-full" />;
  }
  if (contentType.startsWith("image/")) {
    return <img src={url} alt={resource.title} className="mt-4 max-h-[32rem] w-full rounded-xl object-contain" />;
  }
  if (contentType === "application/pdf") {
    return <iframe src={url} title={resource.title} className="mt-4 h-[34rem] w-full rounded-xl border border-slate-700 bg-white" />;
  }
  return (
    <a href={url} download={fileName ?? resource.title} className="mt-4 inline-flex text-sm font-bold text-brand-300 hover:text-brand-200">
      Descargar {fileName ?? resource.title}
    </a>
  );
}

function ProtectedResource({ resource }: ProtectedResourceProps) {
  const requestRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    url?: string;
    contentType?: string;
    fileName?: string;
    message?: string;
  }>({ status: "idle" });

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => () => {
    if (state.url) URL.revokeObjectURL(state.url);
  }, [state.url]);

  async function openResource() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState({ status: "loading" });
    try {
      const file = await getLearningResourceContent(resource, controller.signal);
      if (controller.signal.aborted) return;
      setState({
        status: "ready",
        url: URL.createObjectURL(file.blob),
        contentType: file.contentType,
        fileName: file.fileName,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: "error",
        message: userErrorMessage(error, "No pudimos abrir este recurso. Intenta nuevamente."),
      });
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  return (
    <div>
      {state.status !== "ready" ? (
        <Button onClick={() => void openResource()} disabled={state.status === "loading"} variant="secondary" size="sm">
          {state.status === "loading" ? "Abriendo..." : "Abrir recurso protegido"}
        </Button>
      ) : null}
      {state.status === "error" ? <p role="alert" className="mt-3 text-sm text-red-300">{state.message}</p> : null}
      {state.status === "ready" && state.url && state.contentType ? (
        <ResourcePreview resource={resource} url={state.url} contentType={state.contentType} fileName={state.fileName} />
      ) : null}
    </div>
  );
}

export function LessonResources({ resources }: { resources: LearningResource[] }) {
  if (!resources.length) return null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900 p-6 sm:p-8">
      <h2 className="text-xl font-extrabold text-white">Recursos de la lección</h2>
      <ul className="mt-5 space-y-4">
        {[...resources].sort((a, b) => a.position - b.position).map((resource) => {
          const externalUrl = resource.url ? safeExternalUrl(resource.url) : null;
          return <li key={resource.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white">{resource.title}</h3>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{resource.type}</span>
              {resource.required ? <span className="text-xs font-semibold text-amber-300">Obligatorio</span> : null}
            </div>
            {resource.description ? <p className="mt-2 text-sm leading-6 text-slate-400">{resource.description}</p> : null}
            <div className="mt-4">
              {externalUrl ? (
                <a href={externalUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-300 hover:text-brand-200">
                  Abrir enlace externo ↗
                </a>
              ) : resource.contentPath ? (
                <ProtectedResource resource={resource} />
              ) : <p className="text-sm text-amber-300">Este recurso no está disponible.</p>}
            </div>
            {externalUrl ? <p className="mt-2 text-xs text-amber-300">Este recurso externo necesita conexión a internet.</p> : null}
          </li>;
        })}
      </ul>
    </section>
  );
}
