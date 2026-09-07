import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { env } from "../config/env";
import { ApiError, AUTH_SESSION_EXPIRED_EVENT } from "../services/api";
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
    Boolean(initialSession && env.dataSource === "api"),
  );
  const queryClient = useQueryClient();

  const clearLocalSession = useCallback(() => {
    clearAuthSession();
    queryClient.removeQueries({ queryKey: ["student"] });
    queryClient.removeQueries({ queryKey: ["learning"] });
    queryClient.removeQueries({ queryKey: ["management"] });
    setSession(null);
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, clearLocalSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, clearLocalSession);
  }, [clearLocalSession]);

  useEffect(() => {
    if (!initialSession || env.dataSource !== "api") return;

    let cancelled = false;
    authService.getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        const validatedSession = { ...initialSession, user };
        saveAuthSession(validatedSession);
        setSession(validatedSession);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) clearLocalSession();
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
      const nextSession = await authService.login(input);
      saveAuthSession(nextSession);
      setSession(nextSession);
    },
    async register(input: RegisterInput) {
      const nextSession = await authService.register(input);
      saveAuthSession(nextSession);
      setSession(nextSession);
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        clearLocalSession();
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
      const user = await authService.getCurrentUser();
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
