import { useDeferredValue, useState } from "react";
import CourseFilters from "../components/courses/CourseFilters";
import CourseGrid from "../components/courses/CourseGrid";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { courseCategories } from "../data/courseMocks";
import { useCourses } from "../hooks/useCourses";
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

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <Header active="cursos" />

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-6 py-16 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.28),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(14,116,144,0.12),transparent_30%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
              Catálogo Academix
            </span>
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
              <p className="text-sm text-slate-400" aria-live="polite">
                {query.data ? `${query.data.pagination.total} cursos encontrados` : "Consultando cursos..."}
              </p>
              {query.isFetching && !query.isPending ? (
                <span className="text-xs text-violet-300">Actualizando...</span>
              ) : null}
            </div>

            <div className="mt-8">
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
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                  <h2 className="font-bold text-white">No pudimos cargar el catálogo</h2>
                  <p className="mt-2 text-sm text-red-200">
                    {query.error instanceof Error ? query.error.message : "Intenta de nuevo."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void query.refetch()}
                    className="mt-5 rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white"
                  >
                    Reintentar
                  </button>
                </div>
              ) : query.data.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                  <h2 className="text-lg font-bold text-white">No encontramos coincidencias</h2>
                  <p className="mt-2 text-sm text-slate-400">Prueba con otro término o elimina los filtros.</p>
                  <button
                    type="button"
                    onClick={() => setFilters(initialFilters)}
                    className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <CourseGrid courses={query.data.items} />
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/60 px-6 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-extrabold text-white">¿Por qué estudiar en Academix?</h2>
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
      </main>

      <Footer />
    </div>
  );
}
