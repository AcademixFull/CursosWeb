import { useState } from "react";
import { useUpdateMyProfile } from "../../hooks/useStudent";
import { userErrorMessage } from "../../services/api";
import { Button } from "../ui/Button";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { ProfileAvatar } from "./ProfileAvatar";
import { profileAvatars } from "../../config/profileAvatars";

export function AvatarPicker({ avatarId, name }: { avatarId?: string | null; name: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const mutation = useUpdateMyProfile();
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return <>
    <button type="button" onClick={() => {
      setSelected(avatarId ?? null);
      mutation.reset();
      setOpen(true);
    }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/15 text-2xl font-extrabold text-brand-200 ring-brand-400 transition hover:ring-2 focus-visible:ring-2" aria-label="Editar avatar de perfil">
      <ProfileAvatar avatarId={avatarId}>{initial}</ProfileAvatar>
    </button>
    <Button type="button" variant="secondary" className="mt-2" onClick={() => {
      setSelected(avatarId ?? null);
      mutation.reset();
      setOpen(true);
    }}>Cambiar avatar</Button>
    <ConfirmationDialog open={open} title="Elige tu avatar" pending={mutation.isPending}
      confirmDisabled={selected === (avatarId ?? null)} onCancel={() => setOpen(false)}
      onConfirm={() => mutation.mutate({ avatarId: selected }, { onSuccess: () => setOpen(false) })}
      confirmLabel="Guardar avatar">
      <div className="grid grid-cols-2 gap-3 min-[350px]:grid-cols-3" role="group" aria-label="Personajes de Academix">
        {profileAvatars.map((avatar) => (
          <button key={avatar.id} type="button" aria-pressed={selected === avatar.id}
            onClick={() => setSelected(avatar.id)} disabled={mutation.isPending}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-slate-700 p-2 font-semibold hover:border-brand-400 aria-pressed:border-brand-400 aria-pressed:bg-brand-500/15">
            <img alt="" src={avatar.image} className="aspect-square w-full max-w-20 rounded-lg" />
            {avatar.name}
          </button>
        ))}
        <button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)}
          disabled={mutation.isPending}
          className="col-span-full rounded-xl border border-slate-700 px-3 py-2 font-semibold hover:border-brand-400 aria-pressed:border-brand-400 aria-pressed:bg-brand-500/15">
          Usar inicial ({initial})
        </button>
      </div>
      {mutation.error ? <p role="alert" className="text-red-300">{userErrorMessage(mutation.error, "No pudimos guardar tu avatar.")}</p> : null}
    </ConfirmationDialog>
  </>;
}
