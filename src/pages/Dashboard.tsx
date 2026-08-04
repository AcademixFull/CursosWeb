import { useState } from "react";
import { useNavigate } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { Button, ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";

const dashboardStats = [
  { label: "Cursos en progreso", value: "0" },
  { label: "Cursos completados", value: "0" },
  { label: "Certificados obtenidos", value: "0" },
  { label: "Horas de aprendizaje", value: "0h" },
];

export default function Dashboard() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // La sesión local ya se limpia aunque el backend no responda.
    } finally {
      navigate(ROUTES.home, { replace: true });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Navegación del panel">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <ButtonLink to={ROUTES.courses} variant="ghost" size="sm" className="hidden sm:inline-flex">Explorar cursos</ButtonLink>
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
            </Button>
          </div>
        </nav>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-3xl border border-brand-400/20 bg-linear-to-r from-brand-800 via-violet-700 to-fuchsia-700 p-7 shadow-2xl shadow-brand-950/40 sm:p-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-100">Bienvenido de vuelta</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Hola, {user?.fullName || "estudiante"}</h1>
            <p className="mt-3 max-w-2xl text-brand-100">
              Este es tu panel de aprendizaje. Los cursos y el progreso aparecerán cuando conectemos las inscripciones con academix-backend.
            </p>
          </section>

          <section aria-label="Resumen de aprendizaje" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 shadow-xl shadow-black/20">
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </article>
            ))}
          </section>

          <div className="mt-10">
            <EmptyState title="Aún no tienes cursos inscritos" description="Explora el catálogo y encuentra el curso con el que quieres comenzar." action={<ButtonLink to={ROUTES.courses}>Explorar cursos</ButtonLink>} />
          </div>
        </div>
      </main>
    </div>
  );
}
