interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label = "Progreso del curso" }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-brand-200">{normalizedValue}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-600 to-fuchsia-500"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}
