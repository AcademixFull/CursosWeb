/**
 * Punto central de lectura de variables de entorno del frontend.
 *
 * Regla del proyecto: ningún componente debe leer `import.meta.env.VITE_*`
 * directamente. Todo pasa por este módulo para que:
 *  - haya un único lugar que sepa qué variables existen;
 *  - se pueda advertir en desarrollo si falta alguna;
 *  - agregar/quitar variables no obligue a tocar componentes.
 *
 * VITE_API_URL puede quedar vacía únicamente cuando VITE_DATA_SOURCE=mock.
 * No se lanza aquí para conservar el modo de demostración; el cliente HTTP produce
 * un error explícito si se intenta usar la API sin URL base.
 */

interface AppEnv {
  cache: { catalogTtlMs: number; featuredTtlMs: number; libraryTtlMs: number; gcTimeMs: number; maxInactive: number };
  /** Base URL de academix-backend, ej. http://localhost:3000/api/v1. */
  apiUrl: string;
  /** Token público de Mapbox, usado en la sección de ubicación de /contacto. */
  mapboxToken: string;
  /** Fuente temporal del catálogo: mocks durante frontend-only, API al conectar el backend. */
  dataSource: "mock" | "api";
}

function readEnv(): AppEnv {
  const bounded = (value: unknown, fallback: number, maximum: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
  };
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
  const dataSource = import.meta.env.VITE_DATA_SOURCE === "api" ? "api" : "mock";

  if (import.meta.env.DEV) {
    if (!apiUrl) {
      console.info(
        "[env] VITE_API_URL no está configurada (solo funcionará VITE_DATA_SOURCE=mock)."
      );
    }
    if (!mapboxToken) {
      console.warn(
        "[env] VITE_MAPBOX_TOKEN no está configurada. El mapa de /contacto no se renderizará."
      );
    }
  }

  return { apiUrl, mapboxToken, dataSource, cache: {
    catalogTtlMs: bounded(import.meta.env.VITE_CATALOG_TTL_MS, 60_000, 3_600_000),
    featuredTtlMs: bounded(import.meta.env.VITE_FEATURED_TTL_MS, 30_000, 3_600_000),
    libraryTtlMs: bounded(import.meta.env.VITE_LIBRARY_TTL_MS, 30_000, 3_600_000),
    gcTimeMs: bounded(import.meta.env.VITE_QUERY_GC_MS, 300_000, 3_600_000),
    maxInactive: bounded(import.meta.env.VITE_QUERY_MAX_INACTIVE, 80, 500),
  } };
}

export const env: AppEnv = readEnv();
