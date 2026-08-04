import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthProvider";

/**
 * Punto central para los providers globales de la aplicación.
 *
 * Centraliza React Query y la sesión del frontend para evitar apilar
 * providers manualmente desde App.tsx.
 */

/**
 * Configuración de QueryClient para Academix.
 *
 * - staleTime: 60_000 (1 minuto). El contenido típico de Academix (cursos,
 *   perfil, etc.) no cambia segundo a segundo, así que no tiene sentido
 *   refetch inmediato al volver a montar un componente. Evita peticiones
 *   redundantes sin arriesgar datos muy desactualizados.
 * - refetchOnWindowFocus: false. Para una plataforma de cursos no
 *   necesitamos refrescar datos solo porque el usuario volvió a la pestaña;
 *   el comportamiento por defecto generaría peticiones innecesarias.
 * - retry: 1. academix-backend todavía no existe (y más adelante puede
 *   estar caído en desarrollo); con el valor por defecto (3 reintentos con
 *   backoff) un error tarda varios segundos en mostrarse. Con 1 reintento
 *   el error llega antes y sigue tolerando un fallo transitorio de red.
 *
 * No se agregó ninguna otra opción (cacheTime/gcTime, etc.) porque no hay
 * todavía una necesidad real que la justifique.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        // Los envíos (ej. formulario de contacto) no deben reintentarse
        // automáticamente: podrían duplicar una acción que sí llegó al
        // backend pero cuya respuesta se perdió en la red.
        retry: 0,
      },
    },
  });
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // useState con inicializador perezoso: el QueryClient se crea una sola
  // vez por instancia de la app, incluso con StrictMode montando dos veces.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
