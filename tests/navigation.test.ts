import { describe, expect, it } from "vitest";
import { locationPath, safeReturnTo } from "../src/utils/navigation";
import { authoringRoute, certificateVerificationRoute, roleHomeRoute, ROUTES } from "../src/config/routes";
import { resolvePageTitle } from "../src/utils/pageTitles";

describe("navigation utilities", () => {
  it("preserves pathname, search and hash", () => {
    expect(
      locationPath({ pathname: "/cursos/react", search: "?tab=temario", hash: "#reviews" }),
    ).toBe("/cursos/react?tab=temario#reviews");
  });

  it("accepts an internal return path", () => {
    expect(safeReturnTo("/mis-cursos?estado=activo", "/dashboard")).toBe(
      "/mis-cursos?estado=activo",
    );
  });

  it.each(["https://example.com", "//example.com", "dashboard", null])(
    "rejects unsafe return path %s",
    (returnTo) => {
      expect(safeReturnTo(returnTo, "/dashboard")).toBe("/dashboard");
    },
  );

  it("builds a public certificate verification route with a normalized code", () => {
    expect(certificateVerificationRoute(" acx-2026-abcdef123456 ")).toBe(
      "/verificar-certificado/ACX-2026-ABCDEF123456",
    );
  });

  it("builds the empty public verification form route", () => {
    expect(certificateVerificationRoute()).toBe("/verificar-certificado");
  });

  it("routes each authenticated role to its own panel", () => {
    expect(roleHomeRoute("student")).toBe("/dashboard");
    expect(roleHomeRoute("instructor")).toBe("/panel-instructor");
    expect(roleHomeRoute("admin")).toBe("/administracion");
    expect(roleHomeRoute("moderator")).toBe("/moderacion");
    expect(authoringRoute("course 1")).toBe("/autor/course 1");
    expect(ROUTES.managementProfile).toBe("/mi-informacion");
    expect(ROUTES.organization).toBe("/organizacion");
    expect(ROUTES.pricing).toBe("/precios");
    expect(ROUTES.faq).toBe("/preguntas");
    expect(ROUTES.cart).toBe("/carrito");
  });
  it.each([
    ROUTES.home,
    ROUTES.courses,
    ROUTES.about,
    ROUTES.contact,
    ROUTES.pricing,
    ROUTES.faq,
    ROUTES.login,
    ROUTES.register,
    ROUTES.forgotPassword,
    ROUTES.updatePassword,
    ROUTES.emailConfirmed,
    ROUTES.verifyCertificate,
    ROUTES.dashboard,
    ROUTES.myCourses,
    ROUTES.certificates,
    ROUTES.profile,
    ROUTES.managementProfile,
    ROUTES.instructorApplication,
    ROUTES.instructorPanel,
    ROUTES.admin,
    ROUTES.moderation,
    ROUTES.organization,
    ROUTES.cart,
  ])("assigns a real page title to %s", (route) => {
    expect(resolvePageTitle(route)).not.toBe("Página no encontrada");
  });

  it("assigns titles to valid dynamic routes", () => {
    expect(resolvePageTitle(`${ROUTES.courses}/course-1`)).toBe("Detalle del curso");
    expect(resolvePageTitle(`${ROUTES.instructors}/instructor-1`)).toBe("Perfil del instructor");
    expect(resolvePageTitle(`${ROUTES.learning}/course-1/lesson-1`)).toBe("Aula virtual");
    expect(resolvePageTitle(`${ROUTES.certificates}/certificate-1`)).toBe("Certificado");
    expect(resolvePageTitle(`${ROUTES.authoring}/course-1`)).toBe("Autoría del curso");
  });

});
