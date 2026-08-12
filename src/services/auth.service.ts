import { env } from "../config/env";
import type {
  AuthSession,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
  UpdatePasswordInput,
} from "../types/auth.types";
import { api } from "./api";
import { clearMockStudentStorage } from "../utils/mockStudentStorage";

function createMockSession(email: string, fullName?: string): AuthSession {
  const normalizedEmail = email.trim().toLowerCase();
  const inferredName = normalizedEmail
    .split("@")[0]
    ?.split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    user: {
      id: `demo-${normalizedEmail}`,
      fullName: fullName?.trim() || inferredName || "Estudiante Academix",
      email: normalizedEmail,
      role: "student",
    },
    accessToken: "academix-demo-token",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export const authService = {
  login(input: LoginInput): Promise<AuthSession> {
    if (env.dataSource === "mock") {
      return Promise.resolve(createMockSession(input.email));
    }
    return api.post<AuthSession>("/auth/login", input);
  },

  register(input: RegisterInput): Promise<AuthSession> {
    if (env.dataSource === "mock") {
      return Promise.resolve(createMockSession(input.email, input.fullName));
    }
    return api.post<AuthSession>("/auth/register", input);
  },

  async logout(): Promise<void> {
    if (env.dataSource === "api") {
      await api.post<void>("/auth/logout");
      return;
    }
    clearMockStudentStorage();
  },

  async requestPasswordReset(input: PasswordResetInput): Promise<void> {
    if (env.dataSource === "api") {
      await api.post<void>("/auth/password-reset", input);
    }
  },

  async getCurrentUser(): Promise<AuthSession["user"]> {
    const result = await api.get<{ user: AuthSession["user"] }>("/auth/me");
    return result.user;
  },

  async updatePassword(input: UpdatePasswordInput, recoveryToken: string): Promise<void> {
    await api.patch<void>("/auth/password", input, { authToken: recoveryToken });
  },
};
