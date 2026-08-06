import { useEffect } from "react";
import { useLocation } from "react-router";
import { ROUTES } from "../../config/routes";

function resolvePageTitle(pathname: string): string {
  if (pathname === ROUTES.home) return "Inicio";
  if (pathname === ROUTES.courses) return "Cursos";
  if (pathname.startsWith(`${ROUTES.courses}/`)) return "Detalle del curso";
  if (pathname.startsWith(`${ROUTES.instructors}/`)) return "Perfil del instructor";
  if (pathname === ROUTES.about) return "Nosotros";
  if (pathname === ROUTES.contact) return "Contacto";
  if (pathname === ROUTES.login) return "Iniciar sesión";
  if (pathname === ROUTES.register) return "Crear cuenta";
  if (pathname === ROUTES.forgotPassword) return "Recuperar contraseña";
  if (pathname === ROUTES.dashboard) return "Panel del estudiante";
  if (pathname === ROUTES.myCourses) return "Mis cursos";
  if (pathname === ROUTES.certificates) return "Mis certificados";
  if (pathname.startsWith(`${ROUTES.certificates}/`)) return "Certificado";
  if (pathname === ROUTES.profile) return "Mi perfil";
  if (pathname.startsWith(`${ROUTES.learning}/`)) return "Aula virtual";
  return "Página no encontrada";
}

export function RouteAccessibility() {
  const location = useLocation();
  const pageTitle = resolvePageTitle(location.pathname);

  useEffect(() => {
    document.title = `${pageTitle} | Academix`;
  }, [pageTitle]);

  useEffect(() => {
    function moveToRouteTarget() {
      if (!location.hash) {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      const targetId = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      target.scrollIntoView({ block: "start" });
      if (targetId === "main-content") target.focus({ preventScroll: true });
    }

    const frameId = window.requestAnimationFrame(moveToRouteTarget);
    const retryId = window.setTimeout(moveToRouteTarget, 150);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(retryId);
    };
  }, [location.hash, location.pathname]);

  return (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {pageTitle}
    </span>
  );
}
