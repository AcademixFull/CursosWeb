import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { MAIN_NAVIGATION, type NavigationKey } from "../config/navigation";
import { ROUTES } from "../config/routes";
import { classNames } from "../utils/classNames";
import BrandLogo from "./BrandLogo";
import { Button } from "./ui/Button";

interface HeaderProps {
  active?: NavigationKey;
}

export default function Header({ active }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dialogTitleId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mobileMenuOpen && !showLogin) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setShowLogin(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, showLogin]);

  function linkClasses(key: NavigationKey): string {
    return classNames(
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      active === key
        ? "bg-brand-500/10 text-brand-200"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
    );
  }

  function openLogin() {
    setMobileMenuOpen(false);
    setShowLogin(true);
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowLogin(false);
    setEmail("");
    setPassword("");
    navigate(ROUTES.dashboard);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Navegación principal">
          <BrandLogo />

          <div className="hidden items-center gap-1 lg:flex">
            {MAIN_NAVIGATION.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                aria-current={active === item.key ? "page" : undefined}
                className={linkClasses(item.key)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" size="sm" onClick={openLogin} aria-haspopup="dialog">
              Entrar
            </Button>
            <Button size="sm" onClick={openLogin} aria-haspopup="dialog">
              Registrarse
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 lg:hidden"
          >
            {mobileMenuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </nav>

        {mobileMenuOpen ? (
          <div id="mobile-navigation" className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {MAIN_NAVIGATION.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={active === item.key ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClasses(item.key)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <Button variant="secondary" fullWidth onClick={openLogin} aria-haspopup="dialog">
                  Entrar
                </Button>
                <Button fullWidth onClick={openLogin} aria-haspopup="dialog">
                  Registrarse
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {showLogin ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowLogin(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-brand-950/40"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Academix</p>
                <h2 id={dialogTitleId} className="mt-1 text-xl font-bold text-white">Inicia sesión</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Cerrar inicio de sesión"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm font-medium text-slate-300" htmlFor="login-email">
                Correo electrónico
                <input
                  id="login-email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300" htmlFor="login-password">
                Contraseña
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
                />
              </label>

              <Button type="submit" size="lg" fullWidth>
                Entrar
              </Button>

              <p className="text-center text-xs leading-5 text-slate-500">
                Sesión de demostración. La autenticación real se implementará en la Fase 4.
              </p>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
