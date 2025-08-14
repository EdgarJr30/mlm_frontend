import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import CreateTicketPage from './pages/CreateTicketPage'
// import LoginPage from './pages/LoginPage'
// import KanbanPage from './pages/KanbanPage'
// import InboxPage from './pages/InboxPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import UsersPage from './pages/UsersPage';

import { APP_ROUTES, PUBLIC_ROUTES } from "./components/Routes/appRoutes";
import RequireRole from './components/Routes/RequireRole'
import ProtectedRoute from './components/Routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

// import ForbiddenPage from './pages/ForbiddenPage';
// import UserDashboard from './pages/UserDashboardPage';
// import AutoHome from './components/Routes/AutoHome';
// import { TicketNotificationProvider } from "./context/TicketNotificationContext";

if (process.env.NODE_ENV !== 'development') {
  // Vacía todos los logs en desarrollo
  console.log = function () { };
  console.warn = function () { };
  console.table = function () { };
  console.error = function () { };
}

console.log("🚀 Aplicación iniciada en modo:", process.env.NODE_ENV);

ReactDOM.createRoot(document.getElementById('root')!).render(

  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
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
        {/* <TicketNotificationProvider> */}
        <Routes>
          {/* Públicas / especiales */}
          {PUBLIC_ROUTES.map(r => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}

          {/* Protegidas dinamicamente */}
          {APP_ROUTES.map(r => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <ProtectedRoute>
                  <RequireRole allow={r.allow}>
                    {r.element}
                  </RequireRole>
                </ProtectedRoute>
              }
            />
          ))}

          {/* comodín */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* </TicketNotificationProvider> */}
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
