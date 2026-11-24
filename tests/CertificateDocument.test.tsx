import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificateDocument } from "../src/components/certificates/CertificateDocument";

describe("CertificateDocument", () => {
  it("renders the backend issuer and academic credential", () => {
    render(
      <CertificateDocument
        certificate={{
          id: "certificate-1",
          courseId: "course-1",
          courseTitle: "TypeScript desde cero",
          issuedAt: "2026-08-12T12:00:00.000Z",
          credentialCode: "ACX-2026-ABCDEF123456",
          recipientName: "Marco Antonio",
          durationHours: 12,
          issuerName: "Academix",
          systemSignature: "A".repeat(64),
          signatureAlgorithm: "SHA-256",
          verificationPath: "/api/v1/certificates/verify/ACX-2026-ABCDEF123456",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Marco Antonio" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "TypeScript desde cero" })).toBeVisible();
    expect(screen.getByText("Firma del sistema")).toBeVisible();
    expect(screen.getByText(/ACX-2026-ABCDEF123456/)).toBeVisible();
  });
});
