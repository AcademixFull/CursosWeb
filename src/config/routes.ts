export const ROUTES = {
  home: "/",
  courses: "/cursos",
  about: "/nosotros",
  contact: "/contacto",
  dashboard: "/dashboard",
} as const;

export function courseDetailRoute(courseId: string): string {
  return `${ROUTES.courses}/${courseId}`;
}
