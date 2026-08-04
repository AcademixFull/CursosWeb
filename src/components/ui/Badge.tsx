import type { HTMLAttributes } from "react";
import { classNames } from "../../utils/classNames";

type BadgeTone = "brand" | "neutral" | "success" | "warning";

const tones: Record<BadgeTone, string> = {
  brand: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  neutral: "border-white/10 bg-white/5 text-slate-300",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "brand", className, ...props }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
