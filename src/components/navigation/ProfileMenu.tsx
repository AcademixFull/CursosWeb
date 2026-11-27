import { ProfileAvatar } from "../account/ProfileAvatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { SECONDARY_NAVIGATION } from "../../config/navigation";
import { roleHomeRoute, ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import type { UserRole } from "../../types/auth.types";
import { classNames } from "../../utils/classNames";
import { SidebarIcon, type SidebarIconName } from "./SidebarIcon";

interface ProfileMenuProps {
  compact?: boolean;
}

interface MenuEntry {
  label: string;
  to: string;
  icon: SidebarIconName;
}

const SECONDARY_ICON_BY_KEY: Record<string, SidebarIconName> = {
  nosotros: "info",
  preguntas: "help",
  contacto: "contact",
};

function roleLabel(role: UserRole) {
  if (role === "admin") return "Administrador Academix";
  if (role === "moderator") return "Moderador Academix";
  if (role === "instructor") return "Instructor";
  return "Estudiante";
}

export function ProfileMenu({ compact = false }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const cart = useCart();
  const role = user?.role ?? "student";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const accountEntries = useMemo<MenuEntry[]>(() => {
    if (!isAuthenticated) return [];

    const profileRoute = role === "student" ? ROUTES.profile : ROUTES.managementProfile;
    const primaryEntry: MenuEntry = role === "admin"
      ? { label: "Administración", to: ROUTES.admin, icon: "admin" }
      : role === "moderator"
        ? { label: "Moderación", to: ROUTES.moderation, icon: "moderation" }
        : role === "instructor"
          ? { label: "Panel de instructor", to: ROUTES.instructorPanel, icon: "teach" }
          : { label: "Mi aprendizaje", to: roleHomeRoute(role), icon: "home" };
    const entries: MenuEntry[] = [primaryEntry];

    if (role !== "student") {
      entries.push({ label: "Mi aprendizaje", to: ROUTES.dashboard, icon: "home" });
    }
    if (role === "admin") {
      entries.push({ label: "Moderación", to: ROUTES.moderation, icon: "moderation" });
    }

    entries.push(
      { label: "Mi información", to: profileRoute, icon: "profile" },
      { label: "Organización", to: ROUTES.organization, icon: "organization" },
      { label: "Mis cursos", to: ROUTES.myCourses, icon: "courses" },
      { label: "Certificados", to: ROUTES.certificates, icon: "certificate" },
      { label: `Carrito${cart.count ? ` (${cart.count})` : ""}`, to: ROUTES.cart, icon: "cart" },
    );
    if (role !== "moderator") {
      entries.push({ label: "Quiero enseñar", to: ROUTES.instructorApplication, icon: "teach" });
    }
    entries.push(
      { label: "Catálogo de cursos", to: ROUTES.courses, icon: "catalog" },
      { label: "Precios", to: ROUTES.pricing, icon: "pricing" },
    );

    return entries;
  }, [cart.count, isAuthenticated, role]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setOpen(false);
      setIsLoggingOut(false);
      navigate(ROUTES.home, { replace: true });
    }
  }

  const initials = user?.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "A";
  const firstName = user?.fullName.split(/\s+/).filter(Boolean)[0] || "Cuenta";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="academix-profile-menu"
        aria-label={isAuthenticated ? `Abrir menú de ${user?.fullName ?? "perfil"}` : "Abrir menú de cuenta"}
        onClick={() => setOpen((current) => !current)}
        className={classNames(
          "flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-sm transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white",
          compact ? "px-2" : "px-2.5 sm:px-3",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-xs font-extrabold text-brand-200 ring-1 ring-inset ring-brand-400/25">
          {isAuthenticated ? <ProfileAvatar avatarId={user?.avatarId}>{initials}</ProfileAvatar> : <SidebarIcon name="profile" className="h-5 w-5" />}
        </span>
        {!compact ? <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{firstName}</span> : null}
        <svg aria-hidden="true" viewBox="0 0 20 20" className={classNames("h-4 w-4 text-slate-500 transition", open && "rotate-180")} fill="currentColor"><path fillRule="evenodd" d="M5.2 7.5a.75.75 0 0 1 1.06 0L10 11.24l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.56a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
      </button>

      {open ? (
        <div
          id="academix-profile-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+0.65rem)] z-[70] max-h-[min(78vh,42rem)] w-[min(92vw,20rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/20 ring-1 ring-white/5"
        >
          {isAuthenticated ? (
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 font-extrabold text-brand-200 ring-1 ring-inset ring-brand-400/25"><ProfileAvatar avatarId={user?.avatarId}>{initials}</ProfileAvatar></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-100">{user?.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-brand-300">{roleLabel(role)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-white/10 px-4 py-4">
              <p className="text-sm font-bold text-slate-100">Tu cuenta Academix</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Inicia sesión para ver cursos, organización, certificados y tu información.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link role="menuitem" to={ROUTES.login} onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/5">Entrar</Link>
                <Link role="menuitem" to={ROUTES.register} onClick={() => setOpen(false)} className="rounded-xl bg-brand-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-400">Registrarse</Link>
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <div className="p-2">
              <p className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">Mi Academix</p>
              {accountEntries.map((entry) => (
                <Link
                  role="menuitem"
                  key={`${entry.to}-${entry.label}`}
                  to={entry.to}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-brand-500/10 hover:text-white"
                >
                  <SidebarIcon name={entry.icon} className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-brand-300" />
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="border-t border-white/10 p-2">
            <p className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">Conocer Academix</p>
            {SECONDARY_NAVIGATION.map((entry) => (
              <Link
                role="menuitem"
                key={entry.key}
                to={entry.to}
                onClick={() => setOpen(false)}
                className="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-brand-500/10 hover:text-white"
              >
                <SidebarIcon name={SECONDARY_ICON_BY_KEY[entry.key] ?? "info"} className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-brand-300" />
                {entry.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={toggleTheme}
              className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-brand-500/10 hover:text-white"
            >
              <SidebarIcon name={theme === "dark" ? "moon" : "sun"} className="h-5 w-5 shrink-0 text-brand-300" />
              <span className="flex-1">{theme === "dark" ? "Usar modo claro" : "Usar modo oscuro"}</span>
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
              >
                <SidebarIcon name="logout" className="h-5 w-5 shrink-0" />
                {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
