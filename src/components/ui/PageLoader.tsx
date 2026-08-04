interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Cargando contenido" }: PageLoaderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-400" />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}
