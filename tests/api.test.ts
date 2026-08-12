import { beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function loadApi() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return import("../src/services/api");
}

describe("central API client", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("unwraps a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { status: "ok" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadApi();

    await expect(api.get<{ status: string }>("/health")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("preserves pagination metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          data: [{ id: "course-1" }],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        }),
      ),
    );
    const { api } = await loadApi();

    await expect(api.getPage<{ id: string }>("/courses")).resolves.toEqual({
      items: [{ id: "course-1" }],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
  });

  it("maps the backend error envelope to ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Datos inválidos." },
          },
          422,
        ),
      ),
    );
    const { api } = await loadApi();

    await expect(api.post("/auth/login", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos.",
    });
  });

  it("rejects responses outside the shared contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ status: "ok" })));
    const { api } = await loadApi();

    await expect(api.get("/health")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("clears the stored session and notifies the app after a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "La sesión expiró." },
          },
          401,
        ),
      ),
    );
    const { api, AUTH_SESSION_EXPIRED_EVENT } = await loadApi();
    const { saveAuthSession } = await import("../src/utils/authSessionStore");
    saveAuthSession({
      accessToken: "expired-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: "user-1",
        email: "marco@academix.test",
        fullName: "Marco Antonio",
        role: "student",
      },
    });
    const listener = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);

    await expect(api.get("/auth/me")).rejects.toMatchObject({ status: 401 });

    expect(sessionStorage.length).toBe(0);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  });

  it("exposes Retry-After and x-request-id when the backend limits requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: { code: "RATE_LIMITED", message: "Intenta más tarde." },
          },
          429,
          { "Retry-After": "30", "x-request-id": "request-429" },
        ),
      ),
    );
    const { api } = await loadApi();

    await expect(api.post("/auth/login", {})).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      requestId: "request-429",
      retryAfterSeconds: 30,
    });
  });
});
