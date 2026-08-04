import { createContext } from "react";
import type {
  AuthSession,
  AuthUser,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
} from "../types/auth.types";

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (input: PasswordResetInput) => Promise<void>;
  updateUser: (changes: Partial<Pick<AuthUser, "fullName">>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
