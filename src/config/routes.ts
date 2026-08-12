import type { UserRole } from "../types/auth.types";

export const ROUTES = {
  home: "/",
  courses: "/cursos",
  about: "/nosotros",
  contact: "/contacto",
  login: "/iniciar-sesion",
  register: "/registro",
  forgotPassword: "/recuperar-contrasena",
  updatePassword: "/actualizar-contrasena",
  dashboard: "/dashboard",
  myCourses: "/mis-cursos",
  certificates: "/certificados",
  verifyCertificate: "/verificar-certificado",
  profile: "/perfil",
  learning: "/aprender",
  instructors: "/instructores",
  instructorPanel: "/panel-instructor",
  admin: "/administracion",
  authoring: "/autor",
} as const;

export function courseDetailRoute(courseId: string): string {
  return `${ROUTES.courses}/${courseId}`;
}

export function learningRoute(courseId: string, lessonId?: string): string {
  const coursePath = `${ROUTES.learning}/${courseId}`;
  return lessonId ? `${coursePath}/${lessonId}` : coursePath;
}

export function certificateRoute(certificateId: string): string {
  return `${ROUTES.certificates}/${certificateId}`;
}

export function certificateVerificationRoute(credentialCode?: string): string {
  return credentialCode
    ? `${ROUTES.verifyCertificate}/${encodeURIComponent(credentialCode.trim().toUpperCase())}`
    : ROUTES.verifyCertificate;
}

export function instructorRoute(instructorId: string): string {
  return `${ROUTES.instructors}/${instructorId}`;
}

export function authoringRoute(courseId: string): string {
  return `${ROUTES.authoring}/${courseId}`;
}

export function roleHomeRoute(role?: UserRole): string {
  if (role === "admin") return ROUTES.admin;
  if (role === "instructor") return ROUTES.instructorPanel;
  return ROUTES.dashboard;
}
