import { describe, expect, it } from "vitest";
import { locationPath, safeReturnTo } from "../src/utils/navigation";
import { authoringRoute, certificateVerificationRoute, roleHomeRoute } from "../src/config/routes";

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
    expect(authoringRoute("course 1")).toBe("/autor/course 1");
  });
});
