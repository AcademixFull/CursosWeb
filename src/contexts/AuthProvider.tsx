import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { env } from "../config/env";
import { abortSessionRequests, ApiError, AUTH_SESSION_EXPIRED_EVENT } from "../services/api";
import { clearPrivateQueries } from "../utils/queryClient";
import { offlineStore } from "../offline/store";
import { authService } from "../services/auth.service";
import type { AuthSession, LoginInput, RegisterInput } from "../types/auth.types";
import { clearAuthSession, readAuthSession, saveAuthSession } from "../utils/authSessionStore";
import { AuthContext, type AuthContextValue } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialSession] = useState<AuthSession | null>(readAuthSession);
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [isInitializing, setIsInitializing] = useState(
    Boolean(initialSession?.accessToken && navigator.onLine && env.dataSource === "api"),
  );
  const queryClient = useQueryClient();
  const identity = useRef(initialSession?.user.id);
  const epoch = useRef(0);

  const clearLocalSession = useCallback((invalidate = true) => {
    if (invalidate) epoch.current++;
    const previous = identity.current;
    identity.current = undefined;
    clearAuthSession();
    abortSessionRequests();
    const privateQueries = clearPrivateQueries(queryClient);
    const privateDownloads = previous ? offlineStore.revokeUser(previous) : Promise.resolve();
    setSession(null);
    setIsInitializing(false);
    return Promise.all([privateQueries, privateDownloads]).then(() => undefined);
  }, [queryClient]);

  useEffect(() => {
    // Expired credentials preserve offline work; explicit logout/account switch removes it.
    const expire = () => {
      epoch.current++;
      abortSessionRequests();
      void clearPrivateQueries(queryClient);
      setSession(readAuthSession());
      setIsInitializing(false);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expire);
  }, [queryClient]);

  useEffect(() => {
    if (!session?.accessToken) return;
    const checkExpiry = () => {
      if (Date.parse(session.expiresAt) <= Date.now()) setSession(readAuthSession());
    };
    const timeout = window.setTimeout(checkExpiry, Math.min(Math.max(0, Date.parse(session.expiresAt) - Date.now()), 2_147_483_647));
    window.addEventListener("online", checkExpiry);
    return () => { window.clearTimeout(timeout); window.removeEventListener("online", checkExpiry); };
  }, [session]);

  useEffect(() => {
    if (!initialSession?.accessToken || !navigator.onLine || env.dataSource !== "api") return;

    let cancelled = false;
    const revision = epoch.current;
    authService.getCurrentUser()
      .then((user) => {
        if (cancelled || epoch.current !== revision) return;
        const validatedSession = { ...initialSession, user };
        saveAuthSession(validatedSession);
        setSession(validatedSession);
      })
      .catch((error: unknown) => {
        if (cancelled || epoch.current !== revision) return;
        if (error instanceof ApiError && error.status === 401) setSession(readAuthSession());
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearLocalSession, initialSession]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
    isInitializing,
    async login(input: LoginInput) {
      const revision = ++epoch.current;
      const nextSession = await authService.login(input);
      if (epoch.current !== revision) throw new DOMException("Session changed", "AbortError");
      if (identity.current && identity.current !== nextSession.user.id) await clearLocalSession(false);
      if (epoch.current !== revision) throw new DOMException("Session changed", "AbortError");
      identity.current = nextSession.user.id;
      offlineStore.resumeUser(nextSession.user.id);
      saveAuthSession(nextSession);
      setSession(nextSession);
      setIsInitializing(false);
    },
    async register(input: RegisterInput) {
      const revision = ++epoch.current;
      const nextSession = await authService.register(input);
      if (epoch.current !== revision) throw new DOMException("Session changed", "AbortError");
      if (identity.current && identity.current !== nextSession.user.id) await clearLocalSession(false);
      if (epoch.current !== revision) throw new DOMException("Session changed", "AbortError");
      identity.current = nextSession.user.id;
      offlineStore.resumeUser(nextSession.user.id);
      saveAuthSession(nextSession);
      setSession(nextSession);
      setIsInitializing(false);
    },
    async logout() {
      const revision = ++epoch.current;
      try {
        await authService.logout();
      } finally {
        if (epoch.current === revision) await clearLocalSession();
      }
    },
    requestPasswordReset: authService.requestPasswordReset,
    updatePassword: authService.updatePassword,
    clearSession: clearLocalSession,
    updateUser(changes) {
      setSession((currentSession) => {
        if (!currentSession) return currentSession;

        const nextSession = {
          ...currentSession,
          user: { ...currentSession.user, ...changes },
        };
        saveAuthSession(nextSession);
        return nextSession;
      });
    },
    async refreshUser() {
      const revision = epoch.current;
      const user = await authService.getCurrentUser();
      if (epoch.current !== revision || identity.current !== user.id) throw new DOMException("Session changed", "AbortError");
      setSession((currentSession) => {
        if (!currentSession) return currentSession;
        const nextSession = { ...currentSession, user };
        saveAuthSession(nextSession);
        return nextSession;
      });
      return user;
    },
  }), [clearLocalSession, isInitializing, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
