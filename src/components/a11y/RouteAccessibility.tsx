import { useEffect } from "react";
import { useLocation } from "react-router";
import { resolvePageTitle } from "../../utils/pageTitles";

export function RouteAccessibility() {
  const location = useLocation();
  const pageTitle = resolvePageTitle(location.pathname);

  useEffect(() => {
    document.title = `${pageTitle} | Academix`;
  }, [pageTitle]);

  useEffect(() => {
    function moveToRouteTarget() {
      if (!location.hash) {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      const targetId = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      target.scrollIntoView({ block: "start" });
      if (targetId === "main-content") target.focus({ preventScroll: true });
    }

    const frameId = window.requestAnimationFrame(moveToRouteTarget);
    const retryId = window.setTimeout(moveToRouteTarget, 150);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(retryId);
    };
  }, [location.hash, location.pathname]);

  return (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {pageTitle}
    </span>
  );
}
