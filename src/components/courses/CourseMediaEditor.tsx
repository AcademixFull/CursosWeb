import { type FormEvent, useId, useState } from "react";
import { courseMediaFormats, COURSE_MEDIA_MAX_MB } from "../../config/courseMedia";
import { userErrorMessage } from "../../services/api";
import type { AuthoringCourseMedia, CourseMediaKind } from "../../types/management.types";
import { Button } from "../ui/Button";
import { CourseIntroVideo } from "./CourseIntroVideo";

const mediaFields = {
  cover: {
    title: "Portada",
    description: "Esta imagen identifica el curso en el catálogo. Recomendamos una imagen horizontal.",
  },
  intro: {
    title: "Video introductorio",
    description: "Presenta el curso, explica qué aprenderán los estudiantes y cómo empezar.",
  },
};

interface CourseMediaEditorProps {
  media?: AuthoringCourseMedia;
  pendingKind?: CourseMediaKind;
  errorKind?: CourseMediaKind;
  error?: Error | null;
  disabled?: boolean;
  onRefresh: () => Promise<unknown>;
  onUpload: (kind: CourseMediaKind, file: File) => Promise<unknown>;
}

interface MediaFieldProps {
  kind: CourseMediaKind;
  saved: boolean;
  pending: boolean;
  disabled: boolean;
  error?: Error | null;
  onUpload: CourseMediaEditorProps["onUpload"];
}

function CourseMediaUpload({ kind, saved, pending, disabled, error, onUpload }: MediaFieldProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const field = mediaFields[kind];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    const form = event.currentTarget;
    try {
      await onUpload(kind, file);
      form.reset();
      setFile(null);
    } catch {
      // El campo confirma el resultado de la carga junto al archivo.
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-100">
        {saved ? "Reemplazar" : "Elegir"} {field.title.toLowerCase()}
      </label>
      <input
        id={inputId}
        type="file"
        accept={courseMediaFormats[kind].mimeTypes.join(",")}
        aria-describedby={inputId + "-formats"}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        disabled={disabled}
        className="w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:font-semibold file:text-violet-100"
      />
      <p id={inputId + "-formats"} className="text-xs text-slate-400">{courseMediaFormats[kind].label} · Hasta {COURSE_MEDIA_MAX_MB} MB</p>
      <Button type="submit" size="sm" variant="secondary" disabled={disabled || !file}>
        {pending ? "Subiendo…" : "Subir " + field.title.toLowerCase()}
      </Button>
      {error ? <p role="alert" className="text-sm text-red-300">{userErrorMessage(error, "No pudimos subir el archivo.")}</p> : null}
    </form>
  );
}

export function CourseMediaEditor({ media, pendingKind, errorKind, error, disabled, onRefresh, onUpload }: CourseMediaEditorProps) {
  const titleId = useId();
  const mediaKinds = ["cover", "intro"] as const;

  return (
    <section aria-labelledby={titleId} className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <h2 id={titleId} className="text-xl font-bold text-slate-100">Portada y presentación</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">Sube ambos archivos antes de enviar el curso a revisión.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {mediaKinds.map((kind) => {
          const field = mediaFields[kind];
          const url = kind === "cover" ? media?.coverUrl : media?.introVideoUrl;
          return (
            <article key={kind} className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-bold text-slate-100">{field.title}</h3>
                <span className={url ? "text-sm font-medium text-emerald-500" : "text-sm font-medium text-slate-400"}>
                  {url ? "Guardado" : "Pendiente"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-400">{field.description}</p>
              {url && kind === "cover" ? (
                <img src={url} alt="Portada actual del curso" className="mt-3 aspect-video w-full rounded-lg object-cover" />
              ) : null}
              {url && kind === "intro" ? (
                <div className="mt-3">
                  <CourseIntroVideo key={url} src={url} poster={media?.coverUrl} onRetry={onRefresh} />
                </div>
              ) : null}
              <CourseMediaUpload
                kind={kind}
                saved={Boolean(url)}
                pending={pendingKind === kind}
                disabled={Boolean(disabled || pendingKind)}
                error={errorKind === kind ? error : null}
                onUpload={onUpload}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
