import { useState } from "react";
import { Pagination } from "../components/ui/Pagination";
import { StudentPageHeader } from "../components/student/StudentPageHeader";
import { Badge } from "../components/ui/Badge";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { certificateRoute, certificateVerificationRoute, ROUTES } from "../config/routes";
import { useMyCertificatesPage } from "../hooks/useStudent";
import { userErrorMessage } from "../services/api";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function CertificatesPage() {
  const [page, setPage] = useState(1);
  const query = useMyCertificatesPage(page);

  if (query.isLoading) return <PageLoader label="Cargando certificados" />;
  if (query.isError) {
    return (
      <ErrorState
        description={
          userErrorMessage(query.error, "No pudimos cargar tus certificados.")
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const certificates = query.data?.items ?? [];

  return (
    <div>
      <StudentPageHeader
        eyebrow="Logros Academix"
        title="Mis certificados"
        description="Aquí encontrarás las credenciales obtenidas al completar tus cursos."
      />

      {query.data ? <Pagination label="Certificados" pagination={query.data.pagination} onPageChange={setPage} isPending={query.isFetching} /> : null}
      {certificates.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="relative overflow-hidden rounded-2xl border border-brand-400/25 bg-slate-900 p-6 shadow-xl shadow-black/20 sm:p-8">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand-600/15 blur-2xl" />
              <div className="relative">
                <Badge tone="success">Emitido por Academix</Badge>
                <h2 className="mt-5 text-xl font-bold leading-7 text-white">{certificate.courseTitle}</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Fecha de emisión</dt>
                    <dd className="mt-1 text-slate-200">{dateFormatter.format(new Date(certificate.issuedAt))}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Código de credencial</dt>
                    <dd className="mt-1 font-mono text-brand-200">{certificate.credentialCode}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink to={certificateRoute(certificate.id)} variant="secondary">Ver certificado</ButtonLink>
                  <ButtonLink to={certificateVerificationRoute(certificate.credentialCode)} variant="ghost">Verificar públicamente</ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Aún no tienes certificados"
            description="Completa un curso elegible para obtener tu primera credencial."
            action={<ButtonLink to={ROUTES.myCourses}>Ver mis cursos</ButtonLink>}
          />
        </div>
      )}
    </div>
  );
}
