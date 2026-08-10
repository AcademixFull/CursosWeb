import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ROUTES } from "../../config/routes";
import { useAuth } from "../../hooks/useAuth";
import { locationPath } from "../../utils/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ returnTo: locationPath(location) }} />;
  }

  return children;
}
