import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MAIN_NAVIGATION, type NavigationKey } from "../config/navigation";
import { roleHomeRoute, ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { classNames } from "../utils/classNames";
import BrandLogo from "./BrandLogo";
import { ButtonLink } from "./ui/Button";

interface HeaderProps {
  active?: NavigationKey;
}

export default function Header({ active }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  function linkClasses(key: NavigationKey): string {
    return classNames(
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      active === key
        ? "bg-brand-500/10 text-brand-200"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
    );
  }

  const accountActions = isAuthenticated ? (
    <ButtonLink to={roleHomeRoute(user?.role)} size="sm">
      {user?.fullName.split(" ")[0] || "Mi panel"}
    </ButtonLink>
  ) : (
    <>
      <ButtonLink to={ROUTES.login} variant="ghost" size="sm">Entrar</ButtonLink>
      <ButtonLink to={ROUTES.register} size="sm">Registrarse</ButtonLink>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Navegación principal">
        <BrandLogo />
        <div className="hidden items-center gap-1 lg:flex">
          {MAIN_NAVIGATION.map((item) => (
            <Link key={item.key} to={item.to} aria-current={active === item.key ? "page" : undefined} className={linkClasses(item.key)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">{accountActions}</div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-controls="mobile-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 lg:hidden"
        >
          {mobileMenuOpen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <nav id="mobile-navigation" aria-label="Navegación móvil" className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {MAIN_NAVIGATION.map((item) => (
              <Link key={item.key} to={item.to} aria-current={active === item.key ? "page" : undefined} onClick={() => setMobileMenuOpen(false)} className={linkClasses(item.key)}>
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-4" onClick={() => setMobileMenuOpen(false)}>
              {accountActions}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
