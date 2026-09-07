import { ROUTES } from "../config/routes";

const RECOVERY_KEY = "academix.password-recovery.v1";
const EMAIL_CONFIRMATION_KEY = "academix.email-confirmation.v1";

export interface PasswordRecoveryState {
  accessToken?: string;
  error?: string;
}

function recoveryError(params: URLSearchParams): string | undefined {
  const code = params.get("error_code");
  const description = params.get("error_description")?.replace(/\+/g, " ");

  if (code === "otp_expired") {
    return "El enlace de recuperación expiró. Solicita uno nuevo para continuar.";
  }
  if (code || params.get("error")) {
    return description || "El enlace de recuperación no es válido. Solicita uno nuevo.";
  }
  return undefined;
}

function readRedirectParams(location: Location): URLSearchParams | null {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (hashParams.has("access_token") || hashParams.has("error") || hashParams.has("error_code")) {
    return hashParams;
  }

  const queryParams = new URLSearchParams(location.search);
  if (queryParams.has("access_token") || queryParams.has("error") || queryParams.has("error_code")) {
    return queryParams;
  }
  return null;
}

/**
 * Captura el redirect de Supabase antes de que HashRouter interprete el hash.
 * El token solo vive en sessionStorage y se usa contra Express, nunca contra Supabase.
 */
export function initializePasswordRecoveryRedirect(): boolean {
  const params = readRedirectParams(window.location);
  if (!params) return false;

  const accessToken = params.get("type") === "recovery"
    ? params.get("access_token") ?? undefined
    : undefined;
  const state: PasswordRecoveryState = {
    accessToken,
    error: recoveryError(params),
  };

  if (!state.accessToken && !state.error) return false;
  sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}#${ROUTES.updatePassword}`,
  );
  return true;
}

/** Captura confirmaciones de correo antes de que HashRouter trate el token como una ruta. */
export function initializeEmailConfirmationRedirect(): boolean {
  const params = readRedirectParams(window.location);
  if (!params || params.get("type") === "recovery") return false;
  const type = params.get("type");
  const hasConfirmation = ["signup", "email"].includes(type ?? "") || params.has("error") || params.has("error_code");
  if (!hasConfirmation) return false;
  const error = recoveryError(params)?.replace("recuperación", "confirmación");
  sessionStorage.setItem(EMAIL_CONFIRMATION_KEY, JSON.stringify({ error }));
  window.history.replaceState(null, "", `${window.location.pathname}#${ROUTES.emailConfirmed}`);
  return true;
}

export function initializeAuthRedirect(): boolean {
  return initializeEmailConfirmationRedirect() || initializePasswordRecoveryRedirect();
}

export function readPasswordRecoveryState(): PasswordRecoveryState | null {
  try {
    const value = sessionStorage.getItem(RECOVERY_KEY);
    if (!value) return null;
    const state = JSON.parse(value) as PasswordRecoveryState;
    if (!state.accessToken && !state.error) return null;
    return state;
  } catch {
    clearPasswordRecoveryState();
    return null;
  }
}

export function clearPasswordRecoveryState(): void {
  sessionStorage.removeItem(RECOVERY_KEY);
}

export function readEmailConfirmationError(): string | undefined {
  try {
    const value = sessionStorage.getItem(EMAIL_CONFIRMATION_KEY);
    return value ? (JSON.parse(value) as { error?: string }).error : undefined;
  } catch {
    sessionStorage.removeItem(EMAIL_CONFIRMATION_KEY);
    return "No fue posible confirmar tu cuenta.";
  }
}
