import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { CertificateDocument } from "../components/certificates/CertificateDocument";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { certificateVerificationRoute } from "../config/routes";
import { useCertificateVerification } from "../hooks/useCertificateVerification";
import PublicLayout from "../layouts/PublicLayout";
import { CREDENTIAL_CODE_PATTERN, normalizeCredentialCode } from "../services/certificates.service";

function CertificateVerificationContent({ credentialCode }: { credentialCode?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(credentialCode ?? "");
  const [validationError, setValidationError] = useState("");
  const query = useCertificateVerification(credentialCode);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeCredentialCode(code);
    if (!CREDENTIAL_CODE_PATTERN.test(normalized)) {
      setValidationError("El código debe tener el formato ACX-AAAA-XXXXXXXXXXXX.");
      return;
    }
    setValidationError("");
    setCode(normalized);
    navigate(certificateVerificationRoute(normalized));
  }

  return (
    <PublicLayout>
      <section className="border-b border-white/10 bg-slate-900/60 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="success">Verificación pública</Badge>
          <h1 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">Verifica un certificado Academix</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
            Introduce el código impreso en la credencial. No necesitas iniciar sesión.
          </p>
          <form onSubmit={submit} className="mx-auto mt-8 max-w-xl text-left">
            <label htmlFor="credential-code" className="text-sm font-semibold text-slate-200">Código de credencial</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="credential-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ACX-2026-ABCDEF123456"
                autoComplete="off"
                spellCheck={false}
                maxLength={21}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm uppercase text-white outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
              />
              <Button type="submit">Verificar</Button>
            </div>
            {validationError ? <p role="alert" className="mt-3 text-sm text-red-300">{validationError}</p> : null}
          </form>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {query.isLoading ? <PageLoader label="Verificando credencial" /> : null}
          {query.isError ? (
            <ErrorState
              title="Certificado no verificado"
              description={query.error instanceof Error ? query.error.message : "No pudimos verificar esta credencial."}
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {query.data ? (
            <div>
              <div role="status" className="mb-7 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100">
                <p className="font-extrabold">Certificado válido</p>
                <p className="mt-1 text-sm text-emerald-100/80">La firma y el estado fueron comprobados por Academix.</p>
              </div>
              <CertificateDocument certificate={query.data} />
              <dl className="mt-7 grid gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Emisor</dt><dd className="mt-1 text-white">{query.data.issuerName}</dd></div>
                <div><dt className="text-slate-500">Algoritmo</dt><dd className="mt-1 text-white">{query.data.signatureAlgorithm}</dd></div>
                <div className="sm:col-span-2"><dt className="text-slate-500">Firma del sistema</dt><dd className="mt-1 break-all font-mono text-xs text-brand-200">{query.data.systemSignature}</dd></div>
              </dl>
            </div>
          ) : null}
          {!credentialCode ? <p className="text-center text-sm text-slate-500">Escribe un código para consultar su validez.</p> : null}
        </div>
      </section>
    </PublicLayout>
  );
}

export default function CertificateVerificationPage() {
  const { credentialCode } = useParams<{ credentialCode?: string }>();
  return <CertificateVerificationContent key={credentialCode ?? "empty"} credentialCode={credentialCode} />;
}
