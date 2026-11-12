// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("editable web app manifest", () => {
  it("provides real PNG installation icons and a PNG browser icon", () => {
    const manifest = JSON.parse(readFileSync(resolve("public/manifest.webmanifest"), "utf8"));
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((entry: { sizes: string; type: string }) => entry.sizes === `${size}x${size}` && entry.type === "image/png");
      expect(icon).toBeDefined();
      const bytes = readFileSync(resolve("public", icon.src));
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(bytes.readUInt32BE(16)).toBe(size);
      expect(bytes.readUInt32BE(20)).toBe(size);
    }
    const html = readFileSync(resolve("index.html"), "utf8");
    expect(html).toContain('type="image/png" sizes="32x32"');
    expect(html).toContain('href="%BASE_URL%pwa/apple-touch-icon.png"');
  });
  it("uses the same static manifest during development and publication", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    expect(html).toContain('rel="manifest" href="%BASE_URL%manifest.webmanifest"');
    const manifest = JSON.parse(readFileSync(resolve("public/manifest.webmanifest"), "utf8"));
    expect(manifest.name).toBe("Academix");
    expect(manifest.display).toBe("standalone");
    for (const root of ["https://example.com/", "https://example.com/CursosWeb/"]) {
      expect(new URL(manifest.scope, root).href).toBe(root);
      expect(new URL(manifest.start_url, root).href).toBe(`${root}#/mis-cursos`);
      for (const icon of manifest.icons) {
        expect(new URL(icon.src, root).href.startsWith(root)).toBe(true);
        expect(existsSync(resolve("public", icon.src))).toBe(true);
      }
    }
  });
});
