import { describe, expect, it } from "vitest";
import {
  hasValidationErrors,
  validateEmail,
  validateLogin,
  validateRegister,
} from "../src/validations/auth.validation";

describe("auth validation", () => {
  it("validates email format", () => {
    expect(validateEmail(" ")).toBe("Ingresa tu correo electrónico.");
    expect(validateEmail("marco@academix")).toBe("Ingresa un correo electrónico válido.");
    expect(validateEmail(" marco@academix.mx ")).toBeUndefined();
  });

  it("requires login credentials", () => {
    const errors = validateLogin({ email: "", password: "" });

    expect(errors).toMatchObject({
      email: "Ingresa tu correo electrónico.",
      password: "Ingresa tu contraseña.",
    });
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it("validates every registration rule", () => {
    const errors = validateRegister({
      fullName: "M",
      email: "incorrecto",
      password: "123",
      confirmPassword: "456",
      terms: false,
    });

    expect(errors).toHaveProperty("fullName");
    expect(errors).toHaveProperty("email");
    expect(errors).toHaveProperty("password");
    expect(errors).toHaveProperty("confirmPassword");
    expect(errors).toHaveProperty("terms");
  });

  it("accepts a valid registration", () => {
    const errors = validateRegister({
      fullName: "Marco Antonio",
      email: "marco@academix.mx",
      password: "segura123",
      confirmPassword: "segura123",
      terms: true,
    });

    expect(errors).toEqual({});
    expect(hasValidationErrors(errors)).toBe(false);
  });
});
