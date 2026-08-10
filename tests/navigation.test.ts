import { describe, expect, it } from "vitest";
import { locationPath, safeReturnTo } from "../src/utils/navigation";

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
});
