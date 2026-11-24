import { type ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthProvider";
import { createQueryClient } from "../utils/queryClient";
import { ThemeProvider } from "../contexts/ThemeProvider";
import { CartProvider } from "../contexts/CartProvider";

/**
 * Punto central para los providers globales de la aplicación.
 *
 * Centraliza React Query y la sesión del frontend para evitar apilar
 * providers manualmente desde App.tsx.
 */

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // useState con inicializador perezoso: el QueryClient se crea una sola
  // vez por instancia de la app, incluso con StrictMode montando dos veces.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
