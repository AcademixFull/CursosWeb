import { useEffect, useId, useRef, useState } from "react";
import { profileAvatarCollections, profileAvatars } from "../../config/profileAvatars";
import { useUpdateMyProfile } from "../../hooks/useStudent";
import { userErrorMessage } from "../../services/api";
import { Button } from "../ui/Button";
import { ProfileAvatar } from "./ProfileAvatar";

export function AvatarPicker({ avatarId, name }: { avatarId?: string | null; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [collection, setCollection] = useState("all");
  const mutation = useUpdateMyProfile();
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const activeAvatar = profileAvatars.find(({ id }) => id === selected);
  const visibleCollections = collection === "all"
    ? profileAvatarCollections
    : profileAvatarCollections.filter(({ id }) => id === collection);

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  function openGallery() {
    setSelected(profileAvatars.find(({ id }) => id === avatarId)?.id ?? null);
    setCollection("all");
    mutation.reset();
    setOpen(true);
  }

  return <>
    <button type="button" onClick={openGallery}
      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/15 text-2xl font-extrabold text-brand-200 ring-brand-400 transition hover:ring-2 focus-visible:ring-2"
      aria-label="Editar avatar de perfil">
      <ProfileAvatar avatarId={avatarId}>{initial}</ProfileAvatar>
    </button>
    <Button type="button" variant="secondary" className="mt-2" onClick={openGallery}>Cambiar avatar</Button>

    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); if (!mutation.isPending) setOpen(false); }}
      className="m-auto max-h-[100dvh] w-full max-w-none flex-col overflow-hidden border border-white/10 bg-slate-950 p-0 text-left text-slate-100 shadow-2xl backdrop:bg-slate-950/80 open:flex sm:max-h-[min(88dvh,56rem)] sm:w-[min(94vw,68rem)] sm:rounded-3xl">
      <header className="avatar-gallery-header shrink-0 border-b border-white/10 px-4 pb-3 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-extrabold tracking-tight sm:text-3xl">Elige tu avatar</h2>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3" aria-live="polite">
            <span className="sr-only max-w-32 truncate text-sm font-semibold text-slate-200 sm:not-sr-only">{activeAvatar?.name ?? "Tu inicial"}</span>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 font-bold text-brand-200 ring-1 ring-brand-300/30 sm:size-12">
              <ProfileAvatar avatarId={selected}>{initial}</ProfileAvatar>
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrar colecciones">
          {[{ id: "all", title: "Todos" }, ...profileAvatarCollections].map(({ id, title }) => (
            <button key={id} type="button" aria-pressed={collection === id} onClick={() => setCollection(id)}
              className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-brand-400 aria-pressed:border-brand-400 aria-pressed:bg-brand-600 aria-pressed:text-white">
              {title}
            </button>
          ))}
        </div>
      </header>

      <div key={collection} className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
        {visibleCollections.map(({ id, title, items }) => (
          <section key={id} aria-labelledby={`${titleId}-${id}`}>
            <h3 id={`${titleId}-${id}`} className="mb-3 text-base font-bold sm:text-lg">{title}</h3>
            <div className="grid grid-cols-2 gap-2.5 min-[360px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
              {items.map((avatar) => (
                <button key={avatar.id} type="button" aria-pressed={selected === avatar.id}
                  onClick={() => setSelected(avatar.id)} disabled={mutation.isPending}
                  className="group relative min-w-0 rounded-2xl border border-white/10 bg-slate-900 p-1.5 text-left font-semibold transition hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-brand-300 aria-pressed:border-brand-300 aria-pressed:bg-brand-500/20 aria-pressed:ring-2 aria-pressed:ring-brand-400/60">
                  <img alt="" src={avatar.image} width={192} height={192}
                    className="aspect-square w-full rounded-xl object-cover" />
                  <span className="block px-1 pb-1 pt-1.5 text-sm leading-tight">{avatar.name}</span>
                  {selected === avatar.id ? <span className="absolute right-2 top-2 rounded-full bg-brand-600 px-1.5 text-[#fff]" aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-slate-900 px-4 py-3 sm:px-8">
        {mutation.error ? <p role="alert" className="mb-2 text-sm text-red-300">{userErrorMessage(mutation.error, "No pudimos guardar tu avatar.")}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)} disabled={mutation.isPending}
            className="rounded-lg px-2 py-2 text-sm font-semibold text-brand-200 hover:bg-brand-500/15 aria-pressed:bg-brand-500/15">
            Usar mi inicial ({initial})
          </button>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="button" disabled={mutation.isPending || selected === (avatarId ?? null)}
              onClick={() => mutation.mutate({ avatarId: selected }, { onSuccess: () => setOpen(false) })}>
              {mutation.isPending ? "Guardando…" : "Guardar avatar"}
            </Button>
          </div>
        </div>
      </footer>
    </dialog>
  </>;
}
