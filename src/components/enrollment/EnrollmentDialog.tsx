import { useId } from "react";
import { env } from "../../config/env";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { Button } from "../ui/Button";

interface EnrollmentDialogProps {
  courseTitle: string;
  priceLabel: string;
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function EnrollmentDialog({
  courseTitle,
  priceLabel,
  isPending,
  error,
  onClose,
  onConfirm,
}: EnrollmentDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useDialogFocus({ canClose: !isPending, onClose });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isPending) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-brand-950/40 sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Confirmar inscripción</p>
        <h2 id={titleId} className="mt-3 text-2xl font-extrabold text-white">{courseTitle}</h2>
        <p className="mt-4 text-3xl font-extrabold text-brand-200">{priceLabel}</p>
        <p id={descriptionId} className="mt-4 text-sm leading-6 text-slate-400">
          {env.dataSource === "api"
            ? "Al confirmar, el backend registrará el curso en tu biblioteca de Academix."
            : "Esta demostración no realiza cargos y conserva la inscripción solo durante la sesión."}
        </p>

        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isPending} autoFocus>
            {isPending ? "Inscribiendo..." : "Confirmar inscripción"}
          </Button>
        </div>
      </section>
    </div>
  );
}
