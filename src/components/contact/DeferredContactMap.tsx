import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { env } from "../../config/env";

const ContactMap = lazy(() => import("./ContactMap"));

function MapPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-400" role="status">
      {label}
    </div>
  );
}

export function DeferredContactMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad || !env.mapboxToken) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldLoad]);

  if (!env.mapboxToken) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center bg-slate-950 px-6 text-center">
        <p className="text-sm text-slate-300">El mapa interactivo no está configurado.</p>
        <a
          href="https://www.openstreetmap.org/search?query=Apizaco%2C%20Tlaxcala"
          target="_blank"
          rel="noreferrer"
          className="mt-4 text-sm font-semibold text-violet-300 underline underline-offset-4 hover:text-violet-200"
        >
          Consultar ubicación de Apizaco
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-72" aria-busy={!shouldLoad}>
      {shouldLoad ? (
        <Suspense fallback={<MapPlaceholder label="Cargando mapa interactivo..." />}>
          <ContactMap />
        </Suspense>
      ) : (
        <MapPlaceholder label="El mapa se cargará al acercarte a esta sección." />
      )}
    </div>
  );
}
