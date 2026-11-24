import type { CertificateDetail } from "../../types/student.types";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface CertificateDocumentProps {
  certificate: CertificateDetail;
}

export function CertificateDocument({ certificate }: CertificateDocumentProps) {
  return (
    <article className="certificate-document relative mx-auto w-full max-w-5xl overflow-hidden border-[10px] border-brand-800 bg-white px-6 py-10 text-center text-slate-900 shadow-2xl shadow-black/30 sm:px-12 sm:py-14">
      <div className="pointer-events-none absolute inset-3 border border-brand-300" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-100" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-100" />

      <div className="relative flex min-h-[30rem] flex-col items-center justify-center">
        <div className="flex items-center gap-3 text-brand-700">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-xl font-black text-white" aria-hidden="true">A</span>
          <span className="text-xl font-extrabold tracking-tight">Academix</span>
        </div>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.35em] text-brand-700">Certificado de finalización</p>
        <p className="mt-7 text-sm text-slate-500">Se hace constar que</p>
        <h1 className="mt-3 max-w-full break-words font-serif text-4xl font-bold text-slate-950 sm:text-5xl">{certificate.recipientName}</h1>
        <div className="mt-4 h-px w-full max-w-xl bg-slate-300" />

        <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-600">
          completó satisfactoriamente el curso profesional de {certificate.durationHours} horas
        </p>
        <h2 className="mt-3 max-w-3xl break-words text-2xl font-extrabold leading-9 text-brand-800 sm:text-3xl">
          {certificate.courseTitle}
        </h2>

        <div className="mt-10 grid w-full max-w-3xl gap-8 text-sm sm:grid-cols-2">
          <div>
            <div className="flex h-9 items-end justify-center">
              <p className="font-serif text-2xl font-bold italic text-brand-800">{certificate.issuerName}</p>
            </div>
            <div className="mx-auto h-px max-w-56 bg-slate-400" />
            <p className="mt-3 text-xs font-semibold text-slate-600">Firma del sistema</p>
          </div>
          <div>
            <div className="flex h-9 items-end justify-center">
              <p className="font-bold text-slate-800">{dateFormatter.format(new Date(certificate.issuedAt))}</p>
            </div>
            <div className="mx-auto h-px max-w-56 bg-slate-400" />
            <p className="mt-3 text-xs text-slate-500">Fecha de emisión</p>
          </div>
        </div>

        <div className="mt-9 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 font-mono text-xs text-brand-800">
          Credencial: {certificate.credentialCode}
        </div>
      </div>
    </article>
  );
}
