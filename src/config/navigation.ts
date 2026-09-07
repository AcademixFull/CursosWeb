import { ROUTES } from "./routes";

export type NavigationKey = "inicio" | "cursos" | "precios" | "nosotros" | "preguntas" | "contacto";

export interface NavigationItem {
  key: NavigationKey;
  label: string;
  to: string;
}

export const MAIN_NAVIGATION: readonly NavigationItem[] = [
  { key: "inicio", label: "Inicio", to: ROUTES.home },
  { key: "cursos", label: "Cursos", to: ROUTES.courses },
  { key: "precios", label: "Precios", to: ROUTES.pricing },
];

export const SECONDARY_NAVIGATION: readonly NavigationItem[] = [
  { key: "nosotros", label: "Nosotros", to: ROUTES.about },
  { key: "preguntas", label: "Preguntas", to: ROUTES.faq },
  { key: "contacto", label: "Contacto", to: ROUTES.contact },
];
