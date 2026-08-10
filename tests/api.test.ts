import { beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
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
});
