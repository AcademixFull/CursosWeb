import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FormField } from "../../components/auth/FormField";
import { Button } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../layouts/AuthLayout";
import { ApiError } from "../../services/api";
import { validateEmail } from "../../validations/auth.validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { requestPasswordReset } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateEmail(email);
    setEmailError(validationError ?? "");
    setSubmitError("");

    if (validationError) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setIsSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "No pudimos procesar tu solicitud. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Recupera tu acceso"
      title="Restablece tu contraseña"
      description="Escribe el correo de tu cuenta y recibirás allí las instrucciones de recuperación."
    >
      {isSent ? (
        <div role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm leading-6 text-emerald-100">
          Si existe una cuenta para <strong>{email.trim()}</strong>, recibirás un enlace para crear una contraseña nueva.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {submitError ? (
            <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          ) : null}
          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            placeholder="tu@correo.com"
          />
          <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Solicitar recuperación"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-400">
        <Link to={ROUTES.login} className="font-semibold text-brand-300 transition hover:text-brand-200">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
