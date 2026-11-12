// @vitest-environment node
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { serviceWorkerSource } from "../pwa";

function worker(windowCount = 1) {
  const skipWaiting = vi.fn().mockResolvedValue(undefined);
  const handlers = new Map<string, (event: unknown) => void>();
  const addAll = vi.fn().mockResolvedValue(undefined);
  const match = vi.fn().mockResolvedValue(new Response("cached"));
  const caches = { open: vi.fn().mockResolvedValue({ addAll, match }), keys: vi.fn().mockResolvedValue([]), delete: vi.fn() };
  runInNewContext(serviceWorkerSource(["index.html", "assets/Learning-lazy.js", "pwa/academix.jpg"], "build1"), {
    self: { registration: { scope: "https://example.com/CursosWeb/" }, location: { origin: "https://example.com" },
      skipWaiting, clients: { claim: vi.fn(), matchAll: vi.fn().mockResolvedValue(Array.from({ length: windowCount }, () => ({url: "https://example.com/CursosWeb/"}))) }, addEventListener: (name: string, callback: (event: unknown) => void) => handlers.set(name, callback) },
    caches, URL, Request, Response,
  });
  return { handlers, addAll, match, skipWaiting };
}

describe("PWA app shell", () => {
  it("precaches lazy learning chunks inside the deployment subdirectory", async () => {
    const { handlers, addAll } = worker();
    let promise: Promise<void> | undefined;
    handlers.get("install")!({ waitUntil: (value: Promise<void>) => { promise = value; } });
    await promise;
    expect(addAll.mock.calls[0][0].map((r: Request) => r.url)).toContain("https://example.com/CursosWeb/assets/Learning-lazy.js");
  });

  it("never intercepts private API calls, writes or other applications", () => {
    const { handlers } = worker();
    for (const [url, method] of [
      ["https://example.com/api/v1/users/me/courses", "GET"],
      ["https://example.com/CursosWeb/api/private", "GET"],
      ["https://example.com/CursosWeb/index.html", "PATCH"],
      ["https://other.com/CursosWeb/index.html", "GET"],
      ["https://example.com/another/", "GET"],
    ]) {
      const respondWith = vi.fn();
      handlers.get("fetch")!({ request: { url, method, mode: "cors" }, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    }
  });

  it("opens the cached shell for an offline HashRouter launch", async () => {
    const { handlers, match } = worker();
    let response: Promise<Response> | undefined;
    handlers.get("fetch")!({ request: { url: "https://example.com/CursosWeb/?launch=1", method: "GET", mode: "navigate" },
      respondWith: (value: Promise<Response>) => { response = value; } });
    expect(await (await response)!.text()).toBe("cached");
    expect(match).toHaveBeenCalledWith("https://example.com/CursosWeb/index.html");
  });

  it("activates only after an explicit request when no other window is open", async () => {
    const { handlers, skipWaiting } = worker();
    expect(skipWaiting).not.toHaveBeenCalled();
    let pending: Promise<void> | undefined;
    handlers.get("message")!({ data: { type: "ACADEMIX_ACTIVATE_UPDATE" }, waitUntil: (value: Promise<void>) => { pending = value; } });
    await pending;
    expect(skipWaiting).toHaveBeenCalledOnce();
  });
  it("keeps the old lesson version when another window remains open", async () => {
    const { handlers, skipWaiting } = worker(2);
    const postMessage = vi.fn();
    let pending: Promise<void> | undefined;
    handlers.get("message")!({ data: { type: "ACADEMIX_ACTIVATE_UPDATE" }, source: { postMessage }, waitUntil: (value: Promise<void>) => { pending = value; } });
    await pending;
    expect(skipWaiting).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith({ type: "ACADEMIX_UPDATE_BLOCKED" });
  });
});
