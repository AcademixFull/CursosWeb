import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { SkipLink } from "../components/a11y/SkipLink";
import { Button, ButtonLink } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { classNames } from "../utils/classNames";

const studentNavigation = [
  { label: "Resumen", to: ROUTES.dashboard },
  { label: "Mis cursos", to: ROUTES.myCourses },
  { label: "Certificados", to: ROUTES.certificates },
  { label: "Mi perfil", to: ROUTES.profile },
];

export default function StudentLayout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // El proveedor elimina la sesión local incluso si la API no responde.
    } finally {
      navigate(ROUTES.home, { replace: true });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SkipLink />
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <ButtonLink to={ROUTES.courses} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Explorar cursos
            </ButtonLink>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-200 sm:flex" aria-hidden="true">
              {user?.fullName.charAt(0).toUpperCase() || "A"}
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Saliendo..." : "Salir"}
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/10 bg-slate-900/60" aria-label="Navegación del estudiante">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {studentNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.dashboard}
              className={({ isActive }) => classNames(
                "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                isActive ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10 outline-none sm:px-6 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
}
