import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FormField } from "../../components/auth/FormField";
import { Button } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../layouts/AuthLayout";
import { ApiError } from "../../services/api";
import {
  clearPasswordRecoveryState,
  readPasswordRecoveryState,
} from "../../utils/passwordRecovery";
import { hasValidationErrors, validateNewPassword } from "../../validations/auth.validation";

const initialForm = { password: "", confirmPassword: "" };

export default function UpdatePasswordPage() {
  const [recovery] = useState(readPasswordRecoveryState);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<ReturnType<typeof validateNewPassword>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearSession, updatePassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateNewPassword(form.password, form.confirmPassword);
    setErrors(validationErrors);
    setSubmitError("");
    if (hasValidationErrors(validationErrors) || !recovery?.accessToken) return;

    setIsSubmitting(true);
    try {
      await updatePassword({ password: form.password }, recovery.accessToken);
      clearPasswordRecoveryState();
      clearSession();
      navigate(ROUTES.login, {
        replace: true,
        state: { notice: "Tu contraseña se actualizó. Inicia sesión nuevamente." },
      });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos actualizar tu contraseña. Solicita un enlace nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const recoveryError = recovery?.error
    ?? (!recovery?.accessToken ? "No encontramos un enlace de recuperación válido." : "");

  return (
    <AuthLayout
      eyebrow="Protege tu cuenta"
      title="Crea una contraseña nueva"
      description="Tu contraseña se actualizará de forma segura y se cerrarán tus sesiones anteriores."
    >
      {recoveryError ? (
        <div className="space-y-5">
          <div role="alert" className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {recoveryError}
          </div>
          <Link to={ROUTES.forgotPassword} className="block text-center font-semibold text-brand-300 transition hover:text-brand-200">
            Solicitar otro enlace
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {submitError ? (
            <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          ) : null}
          <FormField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={errors.password}
            hint="Usa al menos 8 caracteres."
            placeholder="Crea una contraseña segura"
          />
          <FormField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            error={errors.confirmPassword}
            placeholder="Repite tu contraseña"
          />
          <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
