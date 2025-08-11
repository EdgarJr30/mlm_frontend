import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import React, { type JSX } from "react";

export default function RequireRole({
  allow,
  children,
}: {
  allow: ("super_admin" | "admin" | "user")[];
  children: JSX.Element;
}) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!role || !allow.includes(role)) return <Navigate to="/403" replace />;

  return children;
}
    