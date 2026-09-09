import type { ReactNode } from "react";

interface StudentPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function StudentPageHeader({ eyebrow, title, description, action }: StudentPageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</p>
        <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h1>
        <p className="mt-3 leading-7 text-slate-400">{description}</p>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </header>
  );
}
