/**
 * Punto central de lectura de variables de entorno del frontend.
 *
 * Regla del proyecto: ningún componente debe leer `import.meta.env.VITE_*`
 * directamente. Todo pasa por este módulo para que:
 *  - haya un único lugar que sepa qué variables existen;
 *  - se pueda advertir en desarrollo si falta alguna;
 *  - agregar/quitar variables no obligue a tocar componentes.
 *
 * IMPORTANTE: en Fase 1 todavía no existe academix-backend, por lo que
 * VITE_API_URL puede estar vacía sin que la app deje de funcionar.
 * No se lanza ningún error aquí: solo se avisa por consola en desarrollo.
 */

interface AppEnv {
  /** Base URL de academix-backend, ej. http://localhost:3000/api/v1 (aún no se usa en Fase 1). */
  apiUrl: string;
  /** Token público de Mapbox, usado en la sección de ubicación de /contacto. */
  mapboxToken: string;
}

function readEnv(): AppEnv {
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

  if (import.meta.env.DEV) {
    if (!apiUrl) {
      // Esperado en Fase 1: todavía no existe academix-backend.
      console.info(
        "[env] VITE_API_URL no está configurada todavía (esperado hasta que exista academix-backend)."
      );
    }
    if (!mapboxToken) {
      console.warn(
        "[env] VITE_MAPBOX_TOKEN no está configurada. El mapa de /contacto no se renderizará."
      );
    }
  }

  return { apiUrl, mapboxToken };
}

export const env: AppEnv = readEnv();
