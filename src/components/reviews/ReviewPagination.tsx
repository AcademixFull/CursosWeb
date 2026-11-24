import type { Pagination } from "../../types/course.types";
import { Button } from "../ui/Button";

interface ReviewPaginationProps {
  pagination: Pagination;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function ReviewPagination({
  pagination,
  isFetching,
  onPageChange,
}: ReviewPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación de reseñas"
      className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row"
    >
      <p className="text-sm text-slate-400" aria-live="polite">
        Página <span className="font-semibold text-white">{pagination.page}</span> de{" "}
        {pagination.totalPages}
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={pagination.page <= 1 || isFetching}
          onClick={() => onPageChange(pagination.page - 1)}
          aria-controls="course-reviews"
        >
          ← Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={pagination.page >= pagination.totalPages || isFetching}
          onClick={() => onPageChange(pagination.page + 1)}
          aria-controls="course-reviews"
        >
          Siguiente →
        </Button>
      </div>
    </nav>
  );
}
