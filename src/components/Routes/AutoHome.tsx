// // src/components/Routes/AutoHome.tsx
// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { usePermissions } from '../../rbac/PermissionsContext';
// import { APP_ROUTES } from './appRoutes';
// import Spinner from '../ui/Spinner';

// export default function AutoHome() {
//   const { loading, isAuthenticated } = useAuth();
//   const { set: perms, ready } = usePermissions();
//   const navigate = useNavigate();

//   useEffect(() => {
//     console.log('[AutoHome] state', {
//       authLoading: loading,
//       isAuthenticated,
//       permsReady: ready,
//       perms: Array.from(perms.values()),
//     });

//     if (loading) return; // esperando AuthContext
//     if (!isAuthenticated) {
//       navigate('/login', { replace: true });
//       return;
//     }
//     if (!ready) return; // esperando permisos

//     const firstAccessible = APP_ROUTES.find((r) =>
//       r.allowPerms.some((c) => perms.has(c))
//     );
//     if (firstAccessible) {
//       console.log('[AutoHome] go →', firstAccessible.path);
//       navigate(firstAccessible.path, { replace: true });
//     } else {
//       console.log('[AutoHome] no accessible route → /403');
//       navigate('/403', { replace: true });
//     }
//   }, [loading, isAuthenticated, ready, perms, navigate]);

//   return (
//     <div className="h-screen w-screen grid place-items-center">
//       <Spinner />
//     </div>
//   );
// }
