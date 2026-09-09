import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { SidebarIcon, type SidebarIconName } from "../components/navigation/SidebarIcon";
import { SkipLink } from "../components/a11y/SkipLink";
import { ROUTES, roleHomeRoute } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { classNames } from "../utils/classNames";
import { NotificationBell } from "../components/navigation/NotificationBell";
import { useCart } from "../hooks/useCart";
import { ProfileMenu } from "../components/navigation/ProfileMenu";

interface MenuItem { label: string; to: string; icon: SidebarIconName; end?: boolean }
interface MenuGroup { label: string; items: MenuItem[] }

export default function AuthenticatedLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const cart = useCart();
  const role = user?.role ?? "student";
  const profileRoute = role === "student" ? ROUTES.profile : ROUTES.managementProfile;

  useEffect(() => {
    if (!drawerOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const homeItem: MenuItem = role === "admin"
    ? { label: "Administración", to: ROUTES.admin, icon: "admin", end: true }
    : role === "moderator"
      ? { label: "Moderación", to: ROUTES.moderation, icon: "moderation", end: true }
      : role === "instructor"
        ? { label: "Panel de instructor", to: ROUTES.instructorPanel, icon: "teach", end: true }
        : { label: "Resumen", to: roleHomeRoute(role), icon: "home", end: true };
  const primary: MenuItem[] = [
    homeItem,
    ...(role !== "student" ? [{ label: "Mi aprendizaje", to: ROUTES.dashboard, icon: "home" as const }] : []),
    ...(role === "admin" ? [{ label: "Moderación", to: ROUTES.moderation, icon: "moderation" as const }] : []),
    { label: "Mis cursos", to: ROUTES.myCourses, icon: "courses" },
    { label: "Certificados", to: ROUTES.certificates, icon: "certificate" },
    { label: "Organización", to: ROUTES.organization, icon: "organization" },
    { label: "Mi información", to: profileRoute, icon: "profile" },
    ...(role !== "moderator" ? [{ label: "Quiero enseñar", to: ROUTES.instructorApplication, icon: "teach" as const }] : []),
  ];
  const groups: MenuGroup[] = [
    { label: "MI ACADEMIX", items: primary },
    { label: "EXPLORAR", items: [
      { label: "Catálogo de cursos", to: ROUTES.courses, icon: "catalog" },
      { label: "Precios", to: ROUTES.pricing, icon: "pricing" },
      { label: `Carrito${cart.count ? ` (${cart.count})` : ""}`, to: ROUTES.cart, icon: "cart" },
    ] },
  ];

  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logout(); } catch { /* la sesión local se limpia de todos modos */ }
    finally {
      navigate(ROUTES.home, { replace: true });
      setIsLoggingOut(false);
    }
  }

  const initials = user?.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";
  const roleLabel = role === "admin" ? "Administrador Academix" : role === "moderator" ? "Moderador Academix" : role === "instructor" ? "Instructor" : "Estudiante";

  const sidebar = (
    <aside className="flex h-full w-[min(86vw,19rem)] flex-col border-r border-white/10 bg-slate-950 shadow-2xl lg:w-72 lg:shadow-none" aria-label="Navegación de cuenta">
      <div className="flex min-h-20 items-center justify-between gap-3 border-b border-white/10 px-5">
        <BrandLogo />
        <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Cerrar menú" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 font-bold text-brand-300 ring-1 ring-brand-400/25">{initials}</div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[0.68rem] font-bold tracking-[0.16em] text-slate-500">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={`${group.label}-${item.to}`}
                  to={item.to}
                  end={item.end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) => classNames(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-500/15 text-brand-200 ring-1 ring-inset ring-brand-400/15"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/8">
                    <SidebarIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <button type="button" onClick={toggleTheme} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300"><SidebarIcon name={theme === "dark" ? "moon" : "sun"} className="h-5 w-5" /></span>
          <span className="flex-1">{theme === "dark" ? "Modo oscuro" : "Modo claro"}</span>
          <span aria-hidden="true" className={classNames("relative h-6 w-11 rounded-full transition", theme === "dark" ? "bg-brand-500" : "bg-slate-300")}><span className={classNames("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition", theme === "dark" ? "left-6" : "left-1")} /></span>
        </button>
        <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60">
          <span className="flex h-8 w-8 items-center justify-center"><SidebarIcon name="logout" className="h-5 w-5" /></span>
          {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SkipLink />
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {drawerOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} /><div className="relative h-full">{sidebar}</div></div> : null}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center gap-2 border-b border-white/10 bg-slate-950/90 px-3 backdrop-blur-xl sm:gap-3 sm:px-6 lg:px-8">
          <button type="button" aria-label="Abrir menú" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 lg:hidden" onClick={() => setDrawerOpen(true)}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <p className="min-w-0 flex-1 truncate text-xs text-slate-400 sm:text-sm"><span className="font-semibold text-slate-100">Academix</span><span className="hidden sm:inline"> · Tu espacio de aprendizaje</span></p>
          <NotificationBell />
          <ProfileMenu compact />
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
