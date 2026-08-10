import { useId, useState, type FormEvent } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import type { CreateReviewInput } from "../../types/course.types";
import { classNames } from "../../utils/classNames";
import { Button } from "../ui/Button";

interface ReviewDialogProps {
  courseTitle: string;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: CreateReviewInput) => void;
}

export function ReviewDialog({ courseTitle, isPending, serverError, onClose, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [validationError, setValidationError] = useState("");
  const titleId = useId();
  const commentId = useId();
  const descriptionId = useId();
  const dialogRef = useDialogFocus({ canClose: !isPending, onClose });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedComment = comment.trim();
    if (normalizedComment.length < 10) {
      setValidationError("Escribe al menos 10 caracteres sobre tu experiencia.");
      return;
    }
    setValidationError("");
    onSubmit({ rating, comment: normalizedComment });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isPending) onClose();
      }}
    >
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-brand-950/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Tu experiencia</p>
        <h2 id={titleId} className="mt-3 text-2xl font-extrabold text-white">Valora este curso</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-400">{courseTitle}</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <fieldset>
            <legend className="text-sm font-medium text-slate-200">Calificación</legend>
            <div className="mt-3 flex gap-2" aria-label={`${rating} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                  className={classNames(
                    "rounded-lg p-1 text-2xl transition",
                    value <= rating ? "text-amber-300" : "text-slate-700 hover:text-slate-500",
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>

          <label htmlFor={commentId} className="mt-5 block text-sm font-medium text-slate-200">
            Comentario
            <textarea
              id={commentId}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={5}
              autoFocus
              placeholder="¿Qué aprendiste y qué destacarías del curso?"
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
            />
            <span className="mt-2 block text-right text-xs text-slate-500">{comment.length}/500</span>
          </label>

          {validationError || serverError ? (
            <div role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {validationError || serverError}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Publicando..." : "Publicar reseña"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
