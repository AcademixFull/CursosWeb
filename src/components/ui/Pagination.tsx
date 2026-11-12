import { Button } from "./Button";

interface Props {
  pagination: { page: number; limit: number; total: number; totalPages?: number };
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isPending?: boolean;
  label?: string;
}

export function Pagination({ pagination, onPageChange, onLimitChange, isPending = false, label = "Paginación" }: Props) {
  const { page, limit, total } = pagination;
  const pages = Math.max(1, pagination.totalPages ?? Math.ceil(total / limit));
  return <nav aria-label={label} className="my-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
    <p aria-live="polite" className="text-sm text-slate-400">{total} resultados · Página {page} de {pages}</p>
    <div className="flex flex-wrap items-center gap-2">
      {onLimitChange ? <label className="text-sm text-slate-400">Por página <select aria-label={`Resultados por página: ${label}`} value={limit} disabled={isPending} onChange={(event) => onLimitChange(Number(event.target.value))} className="rounded-lg border border-white/10 bg-slate-950 px-2 py-2">{[10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
      <Button size="sm" variant="secondary" disabled={page <= 1 || isPending} onClick={() => onPageChange(1)}>Primera</Button>
      <Button size="sm" variant="secondary" disabled={page <= 1 || isPending} onClick={() => onPageChange(page - 1)}>Anterior</Button>
      <Button size="sm" variant="secondary" disabled={page >= pages || isPending} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
    </div>
  </nav>;
}
