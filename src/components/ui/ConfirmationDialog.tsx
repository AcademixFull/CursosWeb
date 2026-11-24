import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
interface Props {
  open: boolean; title: string; children: ReactNode; pending?: boolean;
  onCancel: () => void; onConfirm: () => void; confirmLabel?: string; danger?: boolean;
}
export function ConfirmationDialog({ open, title, children, pending = false, onCancel, onConfirm, confirmLabel = "Confirmar", danger = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return <dialog ref={dialog} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }} className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-white/15 bg-slate-900 p-6 text-slate-100 shadow-2xl backdrop:bg-black/70">
    <h2 className="text-xl font-bold">{title}</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">{children}</div>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><Button autoFocus variant="secondary" disabled={pending} onClick={onCancel}>Cancelar</Button><Button variant={danger ? "danger" : "primary"} disabled={pending} onClick={onConfirm}>{pending ? "Procesando…" : confirmLabel}</Button></div>
  </dialog>;
}
