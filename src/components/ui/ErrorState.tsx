import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "No pudimos cargar el contenido",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center" role="alert">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-200">
        <span aria-hidden="true">!</span>
      </div>
      <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-100/80">{description}</p>
      {onRetry ? (
        <Button variant="danger" className="mt-6" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </section>
  );
}
