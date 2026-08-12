import { useDeferredValue, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import CourseFilters from "../components/courses/CourseFilters";
import CourseGrid from "../components/courses/CourseGrid";
import { CoursePagination } from "../components/courses/CoursePagination";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useCategories } from "../hooks/useCategories";
import { useCourses } from "../hooks/useCourses";
import PublicLayout from "../layouts/PublicLayout";
import type { CourseFilters as Filters, CourseLevel } from "../types/course.types";

const initialFilters: Filters = {
  search: "",
  category: "all",
  level: "all",
  page: 1,
  limit: 12,
};

const courseLevels = new Set<CourseLevel>(["beginner", "intermediate", "advanced"]);

function positiveInteger(value: string | null, fallback: number, maximum?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) return fallback;
  return parsed;
}

function readFilters(params: URLSearchParams): Filters {
  const level = params.get("level");
  return {
    search: params.get("search") ?? "",
    category: params.get("category") ?? "all",
    level: level && courseLevels.has(level as CourseLevel) ? level as CourseLevel : "all",
    page: positiveInteger(params.get("page"), 1),
    limit: positiveInteger(params.get("limit"), 12, 50),
  };
}

function filterParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.level && filters.level !== "all") params.set("level", filters.level);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 12));
  return params;
}

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const deferredSearch = useDeferredValue(filters.search);
  const query = useCourses({ ...filters, search: deferredSearch });
  const categoriesQuery = useCategories();
  const resultsRef = useRef<HTMLDivElement>(null);

  function setFilters(nextFilters: Filters, replace = true) {
    setSearchParams(filterParams(nextFilters), { replace });
  }

  function changePage(page: number) {
    setFilters({ ...filters, page }, false);
    window.requestAnimationFrame(() => resultsRef.current?.focus());
  }

  return (
    <PublicLayout active="cursos">
        <section className="relative overflow-hidden border-b border-white/10 px-6 py-16 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.28),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(14,116,144,0.12),transparent_30%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Badge className="uppercase tracking-wider">
              Catálogo Academix
            </Badge>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Explora nuestros cursos y domina el{" "}
              <span className="text-violet-400">futuro digital</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
              Encuentra una ruta de aprendizaje diseñada por especialistas y avanza a tu ritmo.
            </p>
          </div>
        </section>

        <section className="px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <CourseFilters
              categories={categoriesQuery.data ?? []}
              filters={filters}
              onChange={setFilters}
            />
            {categoriesQuery.isPending ? (
              <p className="mt-3 text-xs text-slate-500" role="status">
                Cargando categorías...
              </p>
            ) : null}
            {categoriesQuery.isError ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-amber-200" role="alert">
                <span>No pudimos cargar las categorías; todavía puedes buscar todos los cursos.</span>
                <button
                  type="button"
                  className="font-semibold underline decoration-amber-300/60 underline-offset-4"
                  onClick={() => void categoriesQuery.refetch()}
                >
                  Reintentar
                </button>
              </div>
            ) : null}
            {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Aún no hay categorías activas; se mostrarán todos los cursos publicados.
              </p>
            ) : null}

            <div className="mt-8 flex items-center justify-between border-b border-white/10 pb-4">
              <p id="course-results-summary" className="text-sm text-slate-400" aria-live="polite">
                {query.data ? `${query.data.pagination.total} cursos encontrados` : "Consultando cursos..."}
              </p>
              {query.isFetching && !query.isPending ? (
                <span className="text-xs text-violet-300">Actualizando...</span>
              ) : null}
            </div>

            <div
              id="course-results"
              ref={resultsRef}
              tabIndex={-1}
              aria-labelledby="course-results-summary"
              className="mt-8 outline-none"
            >
              {query.isPending ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Cargando cursos">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={index}
                      className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                    />
                  ))}
                </div>
              ) : query.isError ? (
                <ErrorState
                  title="No pudimos cargar el catálogo"
                  description={query.error instanceof Error ? query.error.message : "Intenta de nuevo."}
                  onRetry={() => void query.refetch()}
                />
              ) : query.data.items.length === 0 ? (
                <EmptyState
                  title="No encontramos coincidencias"
                  description="Prueba con otro término o elimina los filtros."
                  action={<Button onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button>}
                />
              ) : (
                <CourseGrid courses={query.data.items} />
              )}

              {query.data?.items.length ? (
                <CoursePagination
                  pagination={query.data.pagination}
                  isFetching={query.isFetching}
                  onPageChange={changePage}
                />
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/60 px-6 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <SectionHeader
              title="¿Por qué estudiar en Academix?"
              description="Aprendizaje flexible, acompañado y orientado a resultados profesionales."
              align="center"
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["Aprende a tu ritmo", "Acceso desde cualquier dispositivo y sin fechas límite estrictas."],
                ["Certificados oficiales", "Demuestra tus conocimientos al completar los criterios del curso."],
                ["Instructores expertos", "Contenido creado por profesionales activos en la industria."],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-slate-700 bg-slate-900 p-7">
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
    </PublicLayout>
  );
}
