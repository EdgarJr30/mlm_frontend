// components/Routes/RequireRole.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { RoleName } from "../../services/userService";
import type { JSX } from "react";

type RequireRoleProps = {
  allow: RoleName[];
  children: JSX.Element;
};

export default function RequireRole({ allow, children }: RequireRoleProps) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return null; // o spinner
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/403" replace />;

  return allow.includes(role) ? children : <Navigate to="/403" replace />;
}
