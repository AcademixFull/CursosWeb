import { ROUTES } from "../config/routes";

export function resolvePageTitle(pathname: string): string {
  if (pathname === ROUTES.home) return "Inicio";
  if (pathname === ROUTES.courses) return "Cursos";
  if (pathname.startsWith(`${ROUTES.courses}/`)) return "Detalle del curso";
  if (pathname.startsWith(`${ROUTES.instructors}/`)) return "Perfil del instructor";
  if (pathname === ROUTES.about) return "Nosotros";
  if (pathname === ROUTES.contact) return "Contacto";
  if (pathname === ROUTES.pricing) return "Precios";
  if (pathname === ROUTES.faq) return "Preguntas frecuentes";
  if (pathname === ROUTES.login) return "Iniciar sesión";
  if (pathname === ROUTES.register) return "Crear cuenta";
  if (pathname === ROUTES.forgotPassword) return "Recuperar contraseña";
  if (pathname === ROUTES.updatePassword) return "Actualizar contraseña";
  if (pathname === ROUTES.emailConfirmed) return "Cuenta confirmada";
  if (pathname === ROUTES.verifyCertificate || pathname.startsWith(`${ROUTES.verifyCertificate}/`)) return "Verificar certificado";
  if (pathname === ROUTES.dashboard) return "Panel del estudiante";
  if (pathname === ROUTES.myCourses) return "Mis cursos";
  if (pathname === ROUTES.certificates) return "Mis certificados";
  if (pathname.startsWith(`${ROUTES.certificates}/`)) return "Certificado";
  if (pathname === ROUTES.profile) return "Mi perfil";
  if (pathname === ROUTES.managementProfile) return "Mi información personal";
  if (pathname === ROUTES.instructorApplication) return "Solicitud para enseñar";
  if (pathname.startsWith(`${ROUTES.learning}/`)) return "Aula virtual";
  if (pathname === ROUTES.instructorPanel) return "Panel del instructor";
  if (pathname === ROUTES.admin) return "Administración";
  if (pathname === ROUTES.moderation) return "Moderación";
  if (pathname === ROUTES.organization) return "Mis organizaciones";
  if (pathname === ROUTES.cart) return "Mi carrito";
  if (pathname.startsWith(`${ROUTES.authoring}/`)) return "Autoría del curso";
  return "Página no encontrada";
}
