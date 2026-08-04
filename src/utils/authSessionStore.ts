import type { AuthSession } from "../types/auth.types";

const SESSION_KEY = "academix.demo-session.v1";

let accessToken: string | undefined;

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<AuthSession>;
  return Boolean(
    session.accessToken &&
      session.expiresAt &&
      session.user?.id &&
      session.user.email &&
      session.user.fullName,
  );
}

export function readAuthSession(): AuthSession | null {
  try {
    const storedValue = sessionStorage.getItem(SESSION_KEY);
    if (!storedValue) return null;

    const session: unknown = JSON.parse(storedValue);
    if (!isAuthSession(session) || Date.parse(session.expiresAt) <= Date.now()) {
      clearAuthSession();
      return null;
    }

    accessToken = session.accessToken;
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  accessToken = session.accessToken;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  accessToken = undefined;
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAuthToken(): string | undefined {
  return accessToken;
}
