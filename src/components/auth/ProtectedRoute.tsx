import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { PageLoader } from "../ui/PageLoader";
import { roleHomeRoute, ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import { locationPath } from "../../utils/navigation";
import type { UserRole } from "../../types/auth.types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <PageLoader label="Validando tu sesión" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ returnTo: locationPath(location) }} />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to={roleHomeRoute(user?.role)} replace />;
  }

  return children;
}
