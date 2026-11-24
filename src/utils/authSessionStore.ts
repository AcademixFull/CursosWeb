import type { AuthSession } from "../types/auth.types";
import { env } from "../config/env";

const SESSION_KEY = "academix.demo-session.v1";
const OFFLINE_PROFILE_KEY = "academix.offline-profile.v1";
const profileScope = `${env.apiUrl}|${env.dataSource}`;

let accessToken: string | undefined;
let tabProfile: AuthSession["user"] | undefined;

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
    if (!storedValue) return readOfflineProfile();

    const session: unknown = JSON.parse(storedValue);
    if (!isAuthSession(session) || Date.parse(session.expiresAt) <= Date.now()) {
      accessToken = undefined;
      sessionStorage.removeItem(SESSION_KEY);
      return readOfflineProfile();
    }

    accessToken = session.accessToken;
    tabProfile = session.user;
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

function readOfflineProfile(): AuthSession | null {
  accessToken = undefined;
  try {
    if (tabProfile) return { user: tabProfile, accessToken: "", expiresAt: new Date(0).toISOString() };
    const profile = JSON.parse(sessionStorage.getItem(OFFLINE_PROFILE_KEY) ?? localStorage.getItem(OFFLINE_PROFILE_KEY) ?? "null");
    if (profile?.scope !== profileScope || !profile.user?.id || !profile.user?.email || !profile.user?.fullName) return null;
    tabProfile = profile.user;
    sessionStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(profile));
    // This profile permits local reading only. It is never an API credential.
    return { user: profile.user, accessToken: "", expiresAt: new Date(0).toISOString() };
  } catch { return null; }
}

export function saveAuthSession(session: AuthSession): void {
  accessToken = session.accessToken;
  tabProfile = session.user;
  sessionStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify({ scope: profileScope, user: session.user }));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  try { localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify({ scope: profileScope, user: session.user })); } catch { /* Storage can be disabled. */ }
}

export function clearAuthSession(): void {
  accessToken = undefined;
  tabProfile = undefined;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(OFFLINE_PROFILE_KEY);
  localStorage.removeItem(OFFLINE_PROFILE_KEY);
}

export function expireAuthCredentials(): void {
  accessToken = undefined;
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAuthToken(): string | undefined {
  return accessToken;
}
