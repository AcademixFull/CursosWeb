import { beforeEach, describe, expect, it, vi } from "vitest";

const message = {
  fullName: "Antony Pérez",
  email: "antony@example.com",
  subject: "Información de cursos",
  message: "Quiero conocer las próximas fechas disponibles.",
};

function response() {
  return new Response(JSON.stringify({
    success: true,
    data: { id: "message-1", submittedAt: "2026-08-13T18:00:00.000Z" },
  }), { status: 201, headers: { "Content-Type": "application/json" } });
}

describe("formulario de contacto", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envía el mensaje únicamente al backend de Academix", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
    vi.stubEnv("VITE_DATA_SOURCE", "api");
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(response());
    vi.stubGlobal("fetch", fetchMock);
    const { submitContactMessage } = await import("../src/services/contact.service");

    await expect(submitContactMessage(message)).resolves.toMatchObject({ id: "message-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.academix.test/api/v1/contact/messages",
      expect.objectContaining({ method: "POST", body: JSON.stringify(message) }),
    );
  });
});
