import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

export function sourceVersion(root: string, configuration: { base: string; env: Record<string, string> }): string {
  const hash = createHash("sha256");
  const visit = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) visit(full);
      else { hash.update(relative(root, full).replaceAll("\\", "/")); hash.update(readFileSync(full)); }
    }
  };
  visit(join(root, "src")); visit(join(root, "public"));
  for (const name of ["package.json", "package-lock.json", "vite.config.ts", "pwa.ts", "build-info.ts"]) hash.update(readFileSync(join(root, name)));
  hash.update(configuration.base);
  for (const key of Object.keys(configuration.env).filter((key) => key.startsWith("VITE_")).sort()) {
    hash.update(key); hash.update(configuration.env[key]);
  }
  return hash.digest("hex").slice(0, 20);
}

export function buildIdentity(): Plugin {
  let config: ResolvedConfig;
  const info = () => ({ version: JSON.parse(readFileSync(join(config.root, "package.json"), "utf8")).version as string, sourceVersion: sourceVersion(config.root, config), base: config.base, dataSource: config.env.VITE_DATA_SOURCE === "api" ? "api" : "mock" });
  return {
    name: "academix-build-identity",
    configResolved(value) { config = value; },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== `${config.base}build-info.json`) return next();
        res.setHeader("Cache-Control", "no-store"); res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(info()));
      });
    },
    generateBundle() { this.emitFile({ type: "asset", fileName: "build-info.json", source: JSON.stringify(info()) }); },
  };
}
