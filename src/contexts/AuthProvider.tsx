import { useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthSession, LoginInput, RegisterInput } from "../types/auth.types";
import { clearAuthSession, readAuthSession, saveAuthSession } from "../utils/authSessionStore";
import { AuthContext, type AuthContextValue } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(readAuthSession);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
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
        clearAuthSession();
        setSession(null);
      }
    },
    requestPasswordReset: authService.requestPasswordReset,
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
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
