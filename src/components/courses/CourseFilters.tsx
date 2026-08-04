import type { CourseCategory, CourseFilters as Filters, CourseLevel } from "../../types/course.types";

const levels: Array<{ value: CourseLevel | "all"; label: string }> = [
  { value: "all", label: "Todos los niveles" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

interface CourseFiltersProps {
  categories: CourseCategory[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function CourseFilters({ categories, filters, onChange }: CourseFiltersProps) {
  return (
    <div className="space-y-5" aria-label="Filtros del catálogo">
      <label className="block">
        <span className="sr-only">Buscar cursos</span>
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(event) => onChange({ ...filters, search: event.target.value, page: 1 })}
          placeholder="¿Qué quieres aprender hoy? Ej. React, Python, UI Design..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...filters, category: "all", page: 1 })}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            !filters.category || filters.category === "all"
              ? "bg-violet-600 text-white"
              : "border border-slate-700 text-slate-300 hover:border-violet-500"
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange({ ...filters, category: category.slug, page: 1 })}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              filters.category === category.slug
                ? "bg-violet-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-violet-500"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-300 sm:max-w-xs">
        <span className="shrink-0">Nivel:</span>
        <select
          value={filters.level ?? "all"}
          onChange={(event) =>
            onChange({ ...filters, level: event.target.value as CourseLevel | "all", page: 1 })
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-violet-500"
        >
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
