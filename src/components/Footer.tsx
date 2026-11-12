import { Link } from "react-router";
import { MAIN_NAVIGATION } from "../config/navigation";
import { ROUTES } from "../config/routes";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/80 px-4 py-12 text-slate-400 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-6">
            Educación digital con cursos prácticos creados por especialistas de la industria.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Plataforma</h2>
          <nav className="mt-4 flex flex-col gap-3 text-sm" aria-label="Navegación del pie">
            {MAIN_NAVIGATION.map((item) => (
              <Link key={item.key} to={item.to} className="w-fit transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Estudiantes</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link to={ROUTES.dashboard} className="w-fit transition hover:text-white">Mi aprendizaje</Link>
            <Link to={ROUTES.certificates} className="w-fit transition hover:text-white">Mis certificados</Link>
            <Link to={ROUTES.verifyCertificate} className="w-fit transition hover:text-white">Verificar certificado</Link>
            <Link to={ROUTES.pricing} className="w-fit transition hover:text-white">Planes y precios</Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Soporte</h2>
          <address className="mt-4 flex flex-col gap-3 text-sm not-italic">
            <a href="mailto:soporte@academix.com" className="w-fit transition hover:text-white">
              soporte@academix.com
            </a>
            <a href="tel:+522220000000" className="w-fit transition hover:text-white">
              +52 222 000 0000
            </a>
            <span>Puebla, México</span>
          </address>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-center text-xs sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p>© 2026 Academix. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
