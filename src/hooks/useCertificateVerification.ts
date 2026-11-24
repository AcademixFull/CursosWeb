import { useQuery } from "@tanstack/react-query";
import { verifyCertificate } from "../services/certificates.service";

export function useCertificateVerification(credentialCode: string | undefined) {
  return useQuery({
    queryKey: ["certificate-verification", credentialCode?.trim().toUpperCase()],
    queryFn: () => verifyCertificate(credentialCode ?? ""),
    enabled: Boolean(credentialCode),
    retry: false,
  });
}
