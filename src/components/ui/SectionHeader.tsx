import type { ReactNode } from "react";
import { classNames } from "../../utils/classNames";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={classNames("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 leading-7 text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
