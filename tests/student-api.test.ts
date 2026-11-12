import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../src/types/auth.types";

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Marco Antonio",
  email: "marco@academix.test",
  role: "student",
};

function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function useAuthenticatedApi() {
  vi.stubEnv("VITE_API_URL", "https://api.academix.test/api/v1");
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.resetModules();
  const { saveAuthSession } = await import("../src/utils/authSessionStore");
  saveAuthSession({
    user,
    accessToken: "student-jwt",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

function requestHeaders(fetchMock: ReturnType<typeof vi.fn>, call = 0): Headers {
  return fetchMock.mock.calls[call]?.[1]?.headers as Headers;
}

describe("student services in authenticated API mode", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("confirma con el servidor y avisa a la PWA solo después de obtener acceso", async () => {
    const receipt = { id: "receipt", mode: "simulated", total: 140, currency: "MXN", enrollments: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(successResponse(receipt))
      .mockResolvedValueOnce(errorResponse(403, "COURSE_REQUIRES_APPROVAL", "Este curso requiere aprobación."));
    vi.stubGlobal("fetch", fetchMock);
    await useAuthenticatedApi();
    const listener = vi.fn();
    window.addEventListener("academix:enrolled", listener);
    try {
      const { simulatedCheckout } = await import("../src/services/checkout.service");
      const input = { courseIds: ["22222222-2222-4222-8222-222222222222"], idempotencyKey: "66666666-6666-4666-8666-666666666666" };
      await expect(simulatedCheckout(input)).resolves.toEqual(receipt);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual(input);
      expect(requestHeaders(fetchMock).get("Authorization")).toBe("Bearer student-jwt");
      await expect(simulatedCheckout(input)).rejects.toMatchObject({ code: "COURSE_REQUIRES_APPROVAL" });
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener("academix:enrolled", listener);
    }
  });

  it("loads and updates only the authenticated user's profile", async () => {
    const profile = {
      ...user,
      phone: "+52 246 000 0000",
      country: "México",
      bio: "Estudiante de software.",
    };
    const updated = { ...profile, country: "México" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successResponse(profile))
      .mockResolvedValueOnce(successResponse(updated));
    vi.stubGlobal("fetch", fetchMock);
    await useAuthenticatedApi();
    const { getMyProfile, updateMyProfile } = await import("../src/services/student.service");

    await expect(getMyProfile(user)).resolves.toEqual(profile);
    await expect(updateMyProfile(user, {
      fullName: user.fullName,
      phone: profile.phone,
      country: profile.country,
      bio: profile.bio,
    })).resolves.toEqual(updated);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.academix.test/api/v1/users/me",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.academix.test/api/v1/users/me",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(requestHeaders(fetchMock).get("Authorization")).toBe("Bearer student-jwt");
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toEqual({
      fullName: user.fullName,
      phone: profile.phone,
      country: profile.country,
      bio: profile.bio,
    });
  });

  it("loads the private course library and creates an enrollment", async () => {
    const enrollment = {
      id: "33333333-3333-4333-8333-333333333333",
      course: { id: "22222222-2222-4222-8222-222222222222" },
      status: "in_progress",
      progressPercentage: 0,
      completedLessons: 0,
      totalLessons: 5,
      lastAccessedAt: "2026-08-12T12:00:00.000Z",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [enrollment], pagination: { page: 1, limit: 50, total: 1 } }), { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(successResponse(enrollment, 201));
    vi.stubGlobal("fetch", fetchMock);
    await useAuthenticatedApi();
    const { listMyCourses } = await import("../src/services/student.service");
    const { enrollInCourse } = await import("../src/services/enrollments.service");

    await expect(listMyCourses()).resolves.toEqual([enrollment]);
    await expect(enrollInCourse(enrollment.course.id)).resolves.toEqual(enrollment);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.academix.test/api/v1/courses/${enrollment.course.id}/enrollments`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(requestHeaders(fetchMock, 1).get("Authorization")).toBe("Bearer student-jwt");
  });

  it("preserves the duplicate enrollment conflict from Express", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(409, "ENROLLMENT_ALREADY_EXISTS", "Ya estás inscrito en este curso."),
      ),
    );
    await useAuthenticatedApi();
    const { enrollInCourse } = await import("../src/services/enrollments.service");

    await expect(
      enrollInCourse("22222222-2222-4222-8222-222222222222"),
    ).rejects.toMatchObject({
      status: 409,
      code: "ENROLLMENT_ALREADY_EXISTS",
      message: "Ya estás inscrito en este curso.",
    });
  });

  it("loads certificate summaries and the signed certificate detail", async () => {
    const summary = {
      id: "44444444-4444-4444-8444-444444444444",
      courseId: "22222222-2222-4222-8222-222222222222",
      courseTitle: "TypeScript desde cero",
      issuedAt: "2026-08-12T12:00:00.000Z",
      credentialCode: "ACX-2026-ABCDEF123456",
    };
    const detail = {
      ...summary,
      recipientName: user.fullName,
      durationHours: 12,
      issuerName: "Academix",
      systemSignature: "A".repeat(64),
      signatureAlgorithm: "SHA-256",
      verificationPath: `/api/v1/certificates/verify/${summary.credentialCode}`,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [summary], pagination: { page: 1, limit: 10, total: 1 } }), { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(successResponse(detail));
    vi.stubGlobal("fetch", fetchMock);
    await useAuthenticatedApi();
    const { getMyCertificate, listMyCertificates } = await import(
      "../src/services/student.service"
    );

    await expect(listMyCertificates()).resolves.toEqual([summary]);
    await expect(getMyCertificate(summary.id, user)).resolves.toEqual(detail);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.academix.test/api/v1/users/me/certificates/${summary.id}`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(requestHeaders(fetchMock, 1).get("Authorization")).toBe("Bearer student-jwt");
  });

  it("uses separate React Query keys for different accounts", async () => {
    const { studentQueryKeys } = await import("../src/hooks/useStudent");

    expect(studentQueryKeys.courses("user-a")).not.toEqual(studentQueryKeys.courses("user-b"));
    expect(studentQueryKeys.certificates("user-a")).not.toEqual(
      studentQueryKeys.certificates("user-b"),
    );
  });
});
