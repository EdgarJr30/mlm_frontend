import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { APP_ROUTES, PUBLIC_ROUTES } from './components/Routes/appRoutes';
import RequirePerm from './components/Routes/RequirePerm';
import ProtectedRoute from './components/Routes/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { AssigneeProvider } from './context/AssigneeContext';
import { PermissionsProvider } from './rbac/PermissionsContext';
import { SettingsProvider } from './context/SettingsContext';
import { setupInventoryOfflineSync } from './offline/inventoryOfflineStore';

// Vacía todos los logs en producción
if (process.env.NODE_ENV !== 'development') {
  console.log = function () {};
  console.warn = function () {};
  console.table = function () {};
  console.error = function () {};
}

console.log('🚀 Aplicación iniciada en modo:', process.env.NODE_ENV);

// Opcional: helper para generar deviceId
function ensureDeviceId() {
  if (typeof window === 'undefined') return;

  const KEY = 'mlm:deviceId';
  const existing = window.localStorage.getItem(KEY);
  if (existing) return;

  let newId: string;
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    newId = crypto.randomUUID();
  } else {
    newId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  window.localStorage.setItem(KEY, newId);
}

// Componente raíz para poder usar hooks
function AppRoot() {
  useEffect(() => {
    // 1) Aseguramos un deviceId para trazabilidad offline
    ensureDeviceId();

    // 2) Enganchamos la sincronización offline de inventario
    setupInventoryOfflineSync();
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        <AssigneeProvider>
          <BrowserRouter>
            <PermissionsProvider>
              <SettingsProvider>
                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />
                <Routes>
                  {/* Públicas / especiales */}
                  {PUBLIC_ROUTES.map((r) => (
                    <Route key={r.path} path={r.path} element={r.element} />
                  ))}

                  {/* Protegidas dinámicamente */}
                  {APP_ROUTES.map((r) => (
                    <Route
                      key={r.path}
                      path={r.path}
                      element={
                        <ProtectedRoute>
                          <RequirePerm allow={r.allowPerms}>
                            {r.element}
                          </RequirePerm>
                        </ProtectedRoute>
                      }
                    />
                  ))}

                  {/* comodín */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SettingsProvider>
            </PermissionsProvider>
          </BrowserRouter>
        </AssigneeProvider>
      </UserProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
