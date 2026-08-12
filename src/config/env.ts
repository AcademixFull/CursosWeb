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
  /** Base URL de academix-backend, ej. http://localhost:3000/api/v1. */
  apiUrl: string;
  /** Token público de Mapbox, usado en la sección de ubicación de /contacto. */
  mapboxToken: string;
  /** Fuente temporal del catálogo: mocks durante frontend-only, API al conectar el backend. */
  dataSource: "mock" | "api";
}

function readEnv(): AppEnv {
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

  return { apiUrl, mapboxToken, dataSource };
}

export const env: AppEnv = readEnv();
