import { Link, useLocation } from "react-router";

export function SkipLink() {
  const location = useLocation();

  return (
    <Link
      to={{ pathname: location.pathname, search: location.search, hash: "#main-content" }}
      className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-xl transition focus:translate-y-0"
    >
      Saltar al contenido principal
    </Link>
  );
}
