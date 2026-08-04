export const ROUTES = {
  home: "/",
  courses: "/cursos",
  about: "/nosotros",
  contact: "/contacto",
  login: "/iniciar-sesion",
  register: "/registro",
  forgotPassword: "/recuperar-contrasena",
  dashboard: "/dashboard",
  myCourses: "/mis-cursos",
  certificates: "/certificados",
  profile: "/perfil",
} as const;

export function courseDetailRoute(courseId: string): string {
  return `${ROUTES.courses}/${courseId}`;
}
