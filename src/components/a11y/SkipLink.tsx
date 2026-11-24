import { Link, useLocation } from "react-router";

interface SkipLinkProps {
  targetId?: string;
}

export function SkipLink({ targetId = "main-content" }: SkipLinkProps) {
  const location = useLocation();

  return (
    <Link
      to={{ pathname: location.pathname, search: location.search, hash: `#${targetId}` }}
      className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-xl transition focus:translate-y-0"
    >
      Saltar al contenido principal
    </Link>
  );
}
