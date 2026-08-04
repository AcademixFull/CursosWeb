import type { ReactNode } from "react";
import { Link } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { ROUTES } from "../config/routes";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_88%_80%,rgba(14,116,144,0.16),transparent_32%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLogo />
          <Link to={ROUTES.home} className="text-sm font-medium text-slate-400 transition hover:text-white">
            Volver al inicio
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-brand-950/35 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
          <div className="mt-7">{children}</div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-600">
          Fase frontend: la sesión es temporal y será sustituida por la autenticación del backend.
        </p>
      </div>
    </main>
  );
}
