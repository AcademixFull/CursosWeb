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
  it("rejects a private response parsed after logout even when its headers arrived earlier", async () => {
    let finish!: (payload: object) => void;
    const payload = new Promise<object>((resolve) => { finish = resolve; });
    const response = jsonResponse({ success: true, data: null });
    response.json = () => payload;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    const { api, abortSessionRequests } = await loadApi();
    const { saveAuthSession } = await import("../src/utils/authSessionStore");
    saveAuthSession({ user: { id: "old-account", email: "old@test.com", fullName: "Old", role: "student" }, accessToken: "test-token", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    const request = api.get("/users/me/courses");
    await Promise.resolve(); await Promise.resolve();
    abortSessionRequests();
    finish({ success: true, data: ["private-response"] });
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
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

  it("removes API credentials after a 401 while preserving the offline identity", async () => {
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
    const { saveAuthSession, getAuthToken, readAuthSession } = await import("../src/utils/authSessionStore");
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

    expect(getAuthToken()).toBeUndefined();
    expect(readAuthSession()).toMatchObject({ accessToken: "", user: { id: "user-1" } });
    expect(sessionStorage.getItem("academix.demo-session.v1")).toBeNull();
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

  it("downloads protected binary content with the current Bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      // Response usa el Blob de Node; el Blob de jsdom no implementa stream en Node 22.
      new Response("PDF", {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline; filename*=UTF-8''gu%C3%ADa.pdf",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadApi();
    const { saveAuthSession } = await import("../src/utils/authSessionStore");
    saveAuthSession({
      accessToken: "student-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: "user-1", email: "student@academix.test", fullName: "Estudiante", role: "student" },
    });

    const file = await api.getBinary("/lessons/lesson-1/resources/resource-1/content");

    expect(file.contentType).toBe("application/pdf");
    expect(file.blob.size).toBe(3);
    expect(file.fileName).toBe("guía.pdf");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/lessons/lesson-1/resources/resource-1/content",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer student-token");
  });

  it("maps JSON errors returned by a protected binary endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      success: false,
      error: { code: "RESOURCE_ACCESS_DENIED", message: "No tienes acceso a este recurso." },
    }, 403)));
    const { api } = await loadApi();

    await expect(api.getBinary("/lessons/lesson-1/resources/resource-1/content")).rejects.toMatchObject({
      status: 403,
      code: "RESOURCE_ACCESS_DENIED",
    });
  });

  it("uploads a private course file through Express with its metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: "file-1" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await loadApi();
    const file = new File(["lesson"], "guia.pdf", { type: "application/pdf" });

    await expect(api.postBinary("/authoring/courses/course-1/files", file, {
      headers: { "Content-Type": file.type, "x-file-name": file.name },
    })).resolves.toEqual({ id: "file-1" });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.body).toBe(file);
    expect((request.headers as Headers).get("x-file-name")).toBe("guia.pdf");
  });
  it("uses a user-facing message when Academix cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { api } = await loadApi();

    await expect(api.get("/courses")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "No pudimos comunicarnos con Academix. Intenta nuevamente en unos momentos.",
    });
  });

  it("sanitizes technical errors before they reach a rendered message", async () => {
    const { ApiError, userErrorMessage } = await loadApi();

    expect(
      userErrorMessage(
        new ApiError("La respuesta paginada no incluye sus metadatos.", {
          status: 200,
          code: "INVALID_RESPONSE",
        }),
        "No pudimos cargar los cursos. Intenta nuevamente.",
      ),
    ).toBe("No pudimos cargar los cursos. Intenta nuevamente.");

    expect(
      userErrorMessage(
        new TypeError("Failed to fetch http://localhost:3000/api/v1/courses"),
        "No pudimos cargar los cursos. Intenta nuevamente.",
      ),
    ).toBe("No pudimos cargar los cursos. Intenta nuevamente.");
  });

  it("keeps safe validation messages that help the user correct an action", async () => {
    const { ApiError, userErrorMessage } = await loadApi();
    const error = new ApiError("El precio debe ser mayor a cero.", {
      status: 422,
      code: "COURSE_PRICE_REQUIRED",
    });

    expect(userErrorMessage(error, "No pudimos guardar los cambios.")).toBe(
      "El precio debe ser mayor a cero.",
    );
  });

  it("does not expose technical provider messages to the user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: { code: "AUTH_PROVIDER_ERROR", message: "Supabase backend request failed" },
          },
          502,
        ),
      ),
    );
    const { api } = await loadApi();

    await expect(api.post("/auth/login", {})).rejects.toMatchObject({
      code: "AUTH_PROVIDER_ERROR",
      message: "No pudimos completar la operación. Intenta nuevamente.",
    });
  });

});


it("encodes pagination and filters without losing existing parameters", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.resetModules();
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [] }));
  vi.stubGlobal("fetch", fetchMock);
  const { api } = await import("../src/services/api");
  await api.get("/courses?scope=external", { params: { page: 2, search: "Diseño & datos", empty: undefined } });
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.searchParams.get("scope")).toBe("external");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.searchParams.get("search")).toBe("Diseño & datos");
  expect(url.searchParams.has("empty")).toBe(false);
});
