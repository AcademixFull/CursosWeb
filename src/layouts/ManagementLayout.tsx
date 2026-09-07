import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { SkipLink } from "../components/a11y/SkipLink";
import { Button, ButtonLink } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { classNames } from "../utils/classNames";

export default function ManagementLayout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const home = isAdmin ? ROUTES.admin : ROUTES.instructorPanel;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // La sesión local se elimina aunque el backend no responda.
    } finally {
      navigate(ROUTES.home, { replace: true });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SkipLink />
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <ButtonLink to={ROUTES.courses} variant="ghost" size="sm">Ver catálogo</ButtonLink>
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Saliendo..." : "Salir"}
            </Button>
          </div>
        </div>
      </header>
      <nav className="border-b border-white/10 bg-slate-900/60" aria-label="Navegación de gestión">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 py-2 sm:px-6">
          <NavLink to={home} end className={({ isActive }) => classNames(
            "rounded-lg px-4 py-2.5 text-sm font-medium transition",
            isActive ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}>
            {isAdmin ? "Administración" : "Mis cursos como instructor"}
          </NavLink>
          <NavLink to={ROUTES.managementProfile} className={({ isActive }) => classNames(
            "rounded-lg px-4 py-2.5 text-sm font-medium transition",
            isActive ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}>
            Mi información
          </NavLink>
        </div>
      </nav>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-10 outline-none sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
