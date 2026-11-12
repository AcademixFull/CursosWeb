import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function serviceWorkerSource(files: string[], version: string): string {
  return `
const ROOT = self.registration.scope;
const PREFIX = 'academix-shell:' + new URL(ROOT).pathname + ':';
const CACHE = PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)}.map(path => new URL(path, ROOT).href);
const ALLOWED = new Set(FILES);
const INDEX = new URL('index.html', ROOT).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url => new Request(url, {cache: 'reload'})))));
  // Do not skipWaiting: an open lesson must finish using its own version's chunks.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'ACADEMIX_ACTIVATE_UPDATE') return;
  event.waitUntil((async () => {
    const windows = (await self.clients.matchAll({type: 'window', includeUncontrolled: true})).filter(client => client.url.startsWith(ROOT));
    if (windows.length > 1) {
      event.source?.postMessage({type: 'ACADEMIX_UPDATE_BLOCKED'});
      return;
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const home = new URL(ROOT);
  const isShell = request.mode === 'navigate' && (url.pathname === home.pathname || url.pathname === new URL(INDEX).pathname);
  if (!isShell && !ALLOWED.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(isShell ? INDEX : url.href)).then(response => response || fetch(request)));
});
`;
}

export function academixPwa(): Plugin {
  let root = "";
  return {
    name: "academix-pwa",
    apply: "build",
    configResolved(config) { root = config.root; },
    generateBundle(_options, bundle) {
      // Vite copies this editable public file unchanged into dist/.
      const manifestSource = readFileSync(resolve(root, "public/manifest.webmanifest"), "utf8");
      const manifest = JSON.parse(manifestSource) as { icons: Array<{ src: string }> };
      const iconPaths = manifest.icons.map(({ src }) => {
        if (typeof src !== "string" || !/^(?:[\w-]+\/)*[\w.-]+$/.test(src) || src === "..") {
          throw new Error("Los iconos del manifiesto deben usar rutas locales relativas a public/.");
        }
        return src;
      });
      const files = [...new Set(["index.html", "manifest.webmanifest", "favicon.svg", "pwa/academix.jpg",
        "pwa/favicon-32.png", "pwa/apple-touch-icon.png", ...iconPaths,
        ...Object.keys(bundle).filter((name) => !name.endsWith(".map"))])];
      const hash = createHash("sha256").update(JSON.stringify(files)).update(manifestSource)
        .update(readFileSync(resolve(root, "public/pwa/academix.jpg")));
      for (const iconPath of iconPaths) hash.update(readFileSync(resolve(root, "public", iconPath)));
      for (const output of Object.values(bundle)) hash.update(output.type === "chunk" ? output.code : output.source);
      const version = hash.digest("hex").slice(0, 20);
      this.emitFile({ type: "asset", fileName: "sw.js", source: serviceWorkerSource(files, version) });
    },
  };
}
