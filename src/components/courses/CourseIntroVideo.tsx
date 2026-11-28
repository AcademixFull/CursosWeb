import { useState } from "react";
import { Button } from "../ui/Button";

interface CourseIntroVideoProps {
  src?: string;
  poster?: string;
  onRetry?: () => Promise<unknown>;
}

export function CourseIntroVideo({ src, poster, onRetry }: CourseIntroVideoProps) {
  const [playback, setPlayback] = useState<"ready" | "failed" | "retrying">("ready");

  async function retry() {
    setPlayback("retrying");
    try {
      await onRetry?.();
      setPlayback("ready");
    } catch {
      setPlayback("failed");
    }
  }

  return (
    <div>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950">
        {src && playback === "ready" ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            preload="none"
            aria-label="Video introductorio"
            onError={() => setPlayback("failed")}
            className="h-full w-full object-contain"
          />
        ) : poster ? (
          <img src={poster} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-sm text-slate-300">
            {src ? "Video no disponible" : "El video introductorio aún no está disponible."}
          </span>
        )}
      </div>
      {playback !== "ready" ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p role="status" className="text-sm text-slate-300">No pudimos reproducir el video.</p>
          <Button size="sm" variant="secondary" disabled={playback === "retrying"} onClick={() => void retry()}>Reintentar</Button>
        </div>
      ) : null}
    </div>
  );
}
