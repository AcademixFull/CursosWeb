import type { LoginInput, RegisterInput } from "../types/auth.types";

export type ValidationErrors<T> = Partial<Record<keyof T | "confirmPassword" | "terms", string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Ingresa tu correo electrónico.";
  if (!emailPattern.test(email.trim())) return "Ingresa un correo electrónico válido.";
  return undefined;
}

export function validateLogin(input: LoginInput): ValidationErrors<LoginInput> {
  const errors: ValidationErrors<LoginInput> = {};
  const emailError = validateEmail(input.email);

  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = "Ingresa tu contraseña.";

  return errors;
}

interface RegisterFormInput extends RegisterInput {
  confirmPassword: string;
  terms: boolean;
}

export function validateRegister(input: RegisterFormInput): ValidationErrors<RegisterInput> {
  const errors: ValidationErrors<RegisterInput> = {};
  const emailError = validateEmail(input.email);

  if (input.fullName.trim().length < 3) {
    errors.fullName = "Escribe tu nombre completo.";
  }
  if (emailError) errors.email = emailError;
  if (input.password.length < 8) {
    errors.password = "Usa al menos 8 caracteres.";
  }
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }
  if (!input.terms) {
    errors.terms = "Debes aceptar los términos para continuar.";
  }

  return errors;
}

export function validateNewPassword(
  password: string,
  confirmPassword: string,
): { password?: string; confirmPassword?: string } {
  const errors: { password?: string; confirmPassword?: string } = {};
  if (password.length < 8) errors.password = "Usa al menos 8 caracteres.";
  if (password !== confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
  return errors;
}

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
