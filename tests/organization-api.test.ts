import { beforeEach, describe, expect, it, vi } from "vitest";

function response(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function loadService() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return (await import("../src/services/organization.service")).organizationService;
}

describe("organization service", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("creates and joins organizations through academix-backend with student number", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ id: "org-1" })));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.create({ name: "Universidad Academix", description: "Campus", type: "university" });
    await service.join("ABC12345", "UTT-2026-001");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.academix.test/api/v1/organizations",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.academix.test/api/v1/organizations/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ joinCode: "ABC12345", studentNumber: "UTT-2026-001" }),
      }),
    );
  });

  it("uses organization-admin endpoint only for internal roles", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ id: "entity-1" })));
    vi.stubGlobal("fetch", fetchMock);
    const service = await loadService();

    await service.updateMemberRole("org-1", "user-1", "instructor");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/organizations/org-1/members/user-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
