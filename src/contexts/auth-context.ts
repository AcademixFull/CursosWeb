import { createContext } from "react";
import type {
  AuthSession,
  AuthUser,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
  UpdatePasswordInput,
} from "../types/auth.types";

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (input: PasswordResetInput) => Promise<void>;
  updatePassword: (input: UpdatePasswordInput, recoveryToken: string) => Promise<void>;
  clearSession: () => void;
  updateUser: (changes: Partial<Pick<AuthUser, "fullName" | "avatarId">>) => void;
  refreshUser: () => Promise<AuthUser>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
