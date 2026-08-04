import { Link } from "react-router";
import { MAIN_NAVIGATION } from "../config/navigation";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900 px-6 py-12 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-violet-400">Academix</p>
          <p className="mt-3 max-w-sm text-sm leading-6">
            Educación digital con cursos de alta calidad impartidos por especialistas.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Plataforma</p>
          <nav className="mt-4 flex flex-col gap-3 text-sm" aria-label="Navegación del pie">
            {MAIN_NAVIGATION.map((item) => (
              <Link key={item.key} to={item.to} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-semibold text-white">Soporte</p>
          <p className="mt-4 text-sm">soporte@academix.com</p>
          <p className="mt-2 text-sm">Puebla, México</p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-xs">
        © 2026 Academix. Todos los derechos reservados.
      </p>
    </footer>
  );
}
