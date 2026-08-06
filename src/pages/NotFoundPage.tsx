import { ButtonLink } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import PublicLayout from "../layouts/PublicLayout";

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="relative flex min-h-[70vh] items-center overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2),transparent_42%)]" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-brand-300">Error 404</p>
          <h1 className="mt-5 text-4xl font-extrabold text-white sm:text-6xl">Esta página no existe</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
            Es posible que el enlace haya cambiado o que la dirección esté incompleta. Puedes volver al inicio o continuar explorando los cursos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.home}>Volver al inicio</ButtonLink>
            <ButtonLink to={ROUTES.courses} variant="secondary">Explorar cursos</ButtonLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
