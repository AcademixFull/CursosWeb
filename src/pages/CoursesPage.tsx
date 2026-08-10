import { useDeferredValue, useRef, useState } from "react";
import CourseFilters from "../components/courses/CourseFilters";
import CourseGrid from "../components/courses/CourseGrid";
import { CoursePagination } from "../components/courses/CoursePagination";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { courseCategories } from "../data/courseMocks";
import { useCourses } from "../hooks/useCourses";
import PublicLayout from "../layouts/PublicLayout";
import type { CourseFilters as Filters } from "../types/course.types";

const initialFilters: Filters = {
  search: "",
  category: "all",
  level: "all",
  page: 1,
  limit: 12,
};

export default function CoursesPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const query = useCourses({ ...filters, search: deferredSearch });
  const resultsRef = useRef<HTMLDivElement>(null);

  function changePage(page: number) {
    setFilters((current) => ({ ...current, page }));
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
            <CourseFilters categories={courseCategories} filters={filters} onChange={setFilters} />

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
