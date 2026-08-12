import { env } from "../config/env";
import { courseMocks } from "../data/courseMocks";
import { certificateMocks } from "../data/studentMocks";
import type { VerifiedCertificate } from "../types/student.types";
import { api } from "./api";

const MOCK_DELAY_MS = 140;

export const CREDENTIAL_CODE_PATTERN = /^ACX-\d{4}-[A-F0-9]{12}$/;

export function normalizeCredentialCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function verifyCertificate(credentialCode: string): Promise<VerifiedCertificate> {
  const normalizedCode = normalizeCredentialCode(credentialCode);
  if (!CREDENTIAL_CODE_PATTERN.test(normalizedCode)) {
    throw new Error("El código debe tener el formato ACX-AAAA-XXXXXXXXXXXX.");
  }

  if (env.dataSource === "api") {
    return api.get<VerifiedCertificate>(`/certificates/verify/${encodeURIComponent(normalizedCode)}`);
  }

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  const certificate = certificateMocks.find((item) => item.credentialCode === normalizedCode);
  if (!certificate) throw new Error("No encontramos un certificado vigente con ese código.");
  const course = courseMocks.find((item) => item.id === certificate.courseId);
  if (!course) throw new Error("No encontramos la información académica del certificado.");

  return {
    ...certificate,
    recipientName: "Estudiante Academix",
    durationHours: course.durationHours,
    issuerName: "Academix",
    systemSignature: "A".repeat(64),
    signatureAlgorithm: "SHA-256",
    verificationPath: `/api/v1/certificates/verify/${certificate.credentialCode}`,
    valid: true,
  };
}
