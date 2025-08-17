import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUserRole, type RoleName } from '../services/userService';

type RefreshOptions = { silent?: boolean };

type AuthState = {
  loading: boolean;
  isAuthenticated: boolean;
  role: RoleName | null;
  permissions: Set<string>;
  refresh: (opts?: RefreshOptions) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  super_admin: ['*'], // todos los permisos
  admin: ['*'],
  user: ['tickets.create'],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const hydratedRef = useRef(false);

  const buildPermissions = (r: RoleName | null) => {
    if (!r) return new Set<string>();
    const perms = ROLE_PERMISSIONS[r] ?? [];
    return new Set<string>(perms);
  };

  const refresh = async (opts: RefreshOptions = {}) => {
    const { silent = false } = opts;
    // Solo bloquea la UI si AÚN no hidratamos y no es refresh silencioso
    const shouldBlock = !hydratedRef.current && !silent;

    if (shouldBlock) setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const authed = Boolean(session);
      setIsAuthenticated(authed);

      if (!authed) {
        setRole(null);
        setPermissions(new Set());
        return;
      }

      // Recalcular rol (si lo llamo de DB)
      const r = await getCurrentUserRole();
      setRole(r);
      setPermissions(buildPermissions(r));
    } finally {
      if (shouldBlock) {
        setLoading(false);
        hydratedRef.current = true; // ← a partir de ahora, no se bloquea más la UI
      }
    }
  };

  useEffect(() => {
    // 1) Carga inicial (bloqueante)
    void refresh();

    // 2) Eventos de sesión
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'SIGNED_OUT':
          void refresh();
          break;
        case 'USER_UPDATED':
        case 'TOKEN_REFRESHED':
          void refresh({ silent: true });
          break;

        // Otros eventos no afectan el menú en runtime:
        case 'PASSWORD_RECOVERY':
        case 'MFA_CHALLENGE_VERIFIED':
        default:
          break;
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      isAuthenticated,
      role,
      permissions,
      refresh,
    }),
    [loading, isAuthenticated, role, permissions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
