import { beforeEach, describe, expect, it } from "vitest";
import { ROUTES } from "../src/config/routes";
import {
  clearPasswordRecoveryState,
  initializePasswordRecoveryRedirect,
  readPasswordRecoveryState,
} from "../src/utils/passwordRecovery";

describe("Supabase password recovery redirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, "", "/CursosWeb/");
  });

  it("captures a recovery token before HashRouter reads the hash", () => {
    window.history.replaceState(
      null,
      "",
      "/CursosWeb/#access_token=recovery-token&type=recovery&expires_in=3600",
    );

    expect(initializePasswordRecoveryRedirect()).toBe(true);
    expect(readPasswordRecoveryState()).toEqual({
      accessToken: "recovery-token",
    });
    expect(window.location.hash).toBe(`#${ROUTES.updatePassword}`);
  });

  it("turns an expired OTP redirect into a useful message", () => {
    window.history.replaceState(
      null,
      "",
      "/CursosWeb/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",
    );

    expect(initializePasswordRecoveryRedirect()).toBe(true);
    expect(readPasswordRecoveryState()).toEqual({
      error: "El enlace de recuperación expiró. Solicita uno nuevo para continuar.",
    });

    clearPasswordRecoveryState();
    expect(readPasswordRecoveryState()).toBeNull();
  });

  it("ignores unrelated URLs", () => {
    window.history.replaceState(null, "", "/CursosWeb/#/cursos");

    expect(initializePasswordRecoveryRedirect()).toBe(false);
    expect(readPasswordRecoveryState()).toBeNull();
  });
});
