import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getCurrentUserRole, type RoleName } from "../services/userService";

type AuthState = {
  loading: boolean;
  isAuthenticated: boolean;
  role: RoleName | null;
  permissions: Set<string>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  super_admin: ["*"], // todos los permisos
  admin: ["*"],
  user: ["tickets.create"],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const buildPermissions = (r: RoleName | null) => {
    if (!r) return new Set<string>();
    const perms = ROLE_PERMISSIONS[r] ?? [];
    return new Set<string>(perms);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setIsAuthenticated(Boolean(session));

      if (!session) {
        setRole(null);
        setPermissions(new Set());
      } else {
        const r = await getCurrentUserRole();
        setRole(r);
        setPermissions(buildPermissions(r));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    isAuthenticated,
    role,
    permissions,
    refresh,
  }), [loading, isAuthenticated, role, permissions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
