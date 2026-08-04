import { Link } from "react-router";
import { ROUTES } from "../config/routes";
import { classNames } from "../utils/classNames";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export default function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <Link
      to={ROUTES.home}
      aria-label="Academix, ir al inicio"
      className={classNames("inline-flex items-center gap-2 font-extrabold text-white", className)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-fuchsia-500 shadow-lg shadow-brand-950/40">
        <span aria-hidden="true" className="text-sm">A</span>
      </span>
      {compact ? null : (
        <span className="bg-linear-to-r from-brand-300 to-fuchsia-300 bg-clip-text text-lg text-transparent">
          Academix
        </span>
      )}
    </Link>
  );
}
