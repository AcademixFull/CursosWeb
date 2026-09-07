import { ButtonLink } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { readEmailConfirmationError } from "../../utils/passwordRecovery";

export default function EmailConfirmedPage() {
  const error = readEmailConfirmationError();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
        <p className="text-sm font-semibold text-brand-300">Confirmación de cuenta</p>
        <h1 className="mt-3 text-3xl font-bold">{error ? "No pudimos confirmar tu correo" : "Tu correo quedó verificado"}</h1>
        <p className="mt-4 text-slate-300">{error ?? "Ya puedes iniciar sesión y comenzar a usar Academix."}</p>
        <ButtonLink to={error ? ROUTES.register : ROUTES.login} className="mt-7">{error ? "Volver al registro" : "Iniciar sesión"}</ButtonLink>
      </section>
    </main>
  );
}
