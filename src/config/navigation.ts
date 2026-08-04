import { ROUTES } from "./routes";

export type NavigationKey = "inicio" | "cursos" | "nosotros" | "contacto";

export interface NavigationItem {
  key: NavigationKey;
  label: string;
  to: string;
}

export const MAIN_NAVIGATION: readonly NavigationItem[] = [
  { key: "inicio", label: "Inicio", to: ROUTES.home },
  { key: "cursos", label: "Cursos", to: ROUTES.courses },
  { key: "nosotros", label: "Nosotros", to: ROUTES.about },
  { key: "contacto", label: "Contacto", to: ROUTES.contact },
];
