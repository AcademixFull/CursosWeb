import { useParams } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { SkipLink } from "../components/a11y/SkipLink";
import { CertificateDocument } from "../components/certificates/CertificateDocument";
import { Button, ButtonLink } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "../config/routes";
import { useMyCertificate } from "../hooks/useStudent";

export default function CertificateDetailPage() {
  const { certificateId = "" } = useParams<{ certificateId: string }>();
  const query = useMyCertificate(certificateId);

  if (query.isLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><PageLoader label="Preparando certificado" /></div>;
  }

  if (query.isError || !query.data) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-2xl">
          <ErrorState
            title="Certificado no disponible"
            description={query.error instanceof Error ? query.error.message : "No pudimos cargar este certificado."}
            onRetry={() => void query.refetch()}
          />
          <div className="mt-6 text-center"><ButtonLink to={ROUTES.certificates} variant="secondary">Volver a certificados</ButtonLink></div>
        </div>
      </main>
    );
  }

  return (
    <div className="certificate-print-shell min-h-screen bg-slate-950 text-slate-100">
      <SkipLink />
      <header className="print-hidden border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo />
          <ButtonLink to={ROUTES.certificates} variant="ghost" size="sm">Volver a certificados</ButtonLink>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="px-4 py-10 outline-none sm:px-6 sm:py-14">
        <div className="print-hidden mx-auto mb-7 flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Documento académico</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Tu certificado</h1>
            <p className="mt-2 text-sm text-slate-400">Puedes imprimirlo o elegir “Guardar como PDF” en la ventana de impresión.</p>
          </div>
          <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
        </div>

        <CertificateDocument certificate={query.data} />
      </main>
    </div>
  );
}
