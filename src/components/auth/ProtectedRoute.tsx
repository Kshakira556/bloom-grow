import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { requiresPaywall } from "@/lib/billing";
import * as api from "@/lib/api";

type ProtectedRouteProps = {
  children: ReactNode;
};

type RoleProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const [adminCapable, setAdminCapable] = useState<boolean | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (requiresPaywall(user)) {
    return <Navigate to="/paywall" replace />;
  }

  useEffect(() => {
    let mounted = true;

    const shouldCheckBusinessAdmin =
      Boolean(user) &&
      !allowedRoles.includes(user?.role) &&
      allowedRoles.includes("admin");

    if (!shouldCheckBusinessAdmin) {
      setAdminCapable(null);
      return;
    }

    (async () => {
      const ok = await api.canAccessBusinessAdmin();
      if (mounted) setAdminCapable(ok);
    })();

    return () => {
      mounted = false;
    };
  }, [allowedRoles, user]);

  if (!user) return <Navigate to="/dashboard" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Allow global admins into mediator UI routes (backend already allows admin on mediator endpoints).
    if (allowedRoles.includes("mediator") && user.role === "admin") {
      return <>{children}</>;
    }

    if (allowedRoles.includes("admin")) {
      if (adminCapable === null) return null; // brief gate while checking
      if (adminCapable) return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
