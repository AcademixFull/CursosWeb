import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { FormField } from "../../components/auth/FormField";
import { Button } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../layouts/AuthLayout";
import { ApiError } from "../../services/api";
import type { LoginInput } from "../../types/auth.types";
import { hasValidationErrors, validateLogin } from "../../validations/auth.validation";

interface LoginLocationState {
  returnTo?: string;
}

const initialForm: LoginInput = { email: "", password: "" };

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateLogin(form);
    setErrors(validationErrors);
    setSubmitError("");

    if (hasValidationErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      const state = location.state as LoginLocationState | null;
      navigate(state?.returnTo || ROUTES.dashboard, { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "No pudimos iniciar tu sesión. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión"
      description="Continúa con tus cursos, revisa tu progreso y consulta tus certificados."
    >
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
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
          placeholder="tu@correo.com"
        />

        <div>
          <FormField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />
          <div className="mt-3 text-right">
            <Link to={ROUTES.forgotPassword} className="text-xs font-semibold text-brand-300 transition hover:text-brand-200">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Iniciando sesión..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Todavía no tienes cuenta?{" "}
        <Link to={ROUTES.register} className="font-semibold text-brand-300 transition hover:text-brand-200">
          Regístrate gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
