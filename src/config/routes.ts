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
  profile: "/perfil",
  learning: "/aprender",
  instructors: "/instructores",
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

export function instructorRoute(instructorId: string): string {
  return `${ROUTES.instructors}/${instructorId}`;
}
