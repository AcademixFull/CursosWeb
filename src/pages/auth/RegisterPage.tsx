import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { FormField } from "../../components/auth/FormField";
import { Button } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import AuthLayout from "../../layouts/AuthLayout";
import { ApiError, userErrorMessage } from "../../services/api";
import { hasValidationErrors, validateRegister } from "../../validations/auth.validation";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

type RegisterErrors = Partial<Record<keyof typeof initialForm, string>>;

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateRegister(form);
    setErrors(validationErrors);
    setSubmitError("");
    setSubmitNotice("");

    if (hasValidationErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_CONFIRMATION_REQUIRED") {
        setSubmitNotice(userErrorMessage(error, "Revisa tu correo para continuar con el registro."));
        setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
        return;
      }
      setSubmitError(
        userErrorMessage(error, "No pudimos crear tu cuenta. Intenta nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Empieza tu camino"
      title="Crea tu cuenta"
      description="Regístrate para organizar tus cursos y dar seguimiento a todo tu aprendizaje."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {submitNotice ? (
          <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {submitNotice}
          </div>
        ) : null}
        {submitError ? (
          <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {submitError}
          </div>
        ) : null}

        <FormField
          label="Nombre completo"
          type="text"
          autoComplete="name"
          autoFocus
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          error={errors.fullName}
          placeholder="Tu nombre"
        />
        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
          placeholder="tu@correo.com"
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
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

        <label className="flex items-start gap-3 text-sm leading-6 text-slate-400">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(event) => setForm((current) => ({ ...current, terms: event.target.checked }))}
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? "register-terms-error" : undefined}
            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 accent-brand-500"
          />
          <span>
            Acepto los términos de uso y el aviso de privacidad de Academix.
            {errors.terms ? (
              <span id="register-terms-error" className="mt-1 block text-xs text-red-300">{errors.terms}</span>
            ) : null}
          </span>
        </label>

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta gratis"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes una cuenta?{" "}
        <Link to={ROUTES.login} className="font-semibold text-brand-300 transition hover:text-brand-200">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
