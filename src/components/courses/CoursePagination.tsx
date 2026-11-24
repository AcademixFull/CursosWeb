import type { Pagination } from "../../types/course.types";
import { Button } from "../ui/Button";

interface CoursePaginationProps {
  pagination: Pagination;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function CoursePagination({
  pagination,
  isFetching,
  onPageChange,
}: CoursePaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row"
    >
      <p className="text-sm text-slate-400" aria-live="polite">
        Página <span className="font-semibold text-white">{page}</span> de {totalPages}
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(page - 1)}
          aria-controls="course-results"
        >
          ← Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
          aria-controls="course-results"
        >
          Siguiente →
        </Button>
      </div>
    </nav>
  );
}
