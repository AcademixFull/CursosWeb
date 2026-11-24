import { beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadService() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  return import("../src/services/certificates.service");
}

describe("public certificate verification", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes the code and verifies it through Express without authentication", async () => {
    const certificate = {
      id: "certificate-1",
      courseId: "course-1",
      courseTitle: "TypeScript",
      issuedAt: "2026-08-12T01:00:00.000Z",
      credentialCode: "ACX-2026-ABCDEF123456",
      recipientName: "Ana Pérez",
      durationHours: 12,
      issuerName: "Academix",
      systemSignature: "A".repeat(64),
      signatureAlgorithm: "SHA-256",
      verificationPath: "/api/v1/certificates/verify/ACX-2026-ABCDEF123456",
      valid: true,
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: certificate }));
    vi.stubGlobal("fetch", fetchMock);
    const { verifyCertificate } = await loadService();

    await expect(verifyCertificate(" acx-2026-abcdef123456 ")).resolves.toEqual(certificate);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.academix.test/api/v1/certificates/verify/ACX-2026-ABCDEF123456",
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("rejects invalid formats before sending a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { verifyCertificate } = await loadService();

    await expect(verifyCertificate("ACX-INVALIDO")).rejects.toThrow(
      "El código debe tener el formato ACX-AAAA-XXXXXXXXXXXX.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves the backend response for a missing or revoked credential", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      success: false,
      error: { code: "CERTIFICATE_NOT_FOUND", message: "No encontramos la credencial." },
    }, 404)));
    const { verifyCertificate } = await loadService();

    await expect(verifyCertificate("ACX-2026-ABCDEF123456")).rejects.toMatchObject({
      status: 404,
      code: "CERTIFICATE_NOT_FOUND",
    });
  });
});
