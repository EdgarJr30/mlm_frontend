import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateTicketPage from './pages/CreateTicketPage'
import LoginPage from './pages/LoginPage'
import KanbanPage from './pages/KanbanPage'
import InboxPage from './pages/InboxPage';
import ProtectedRoute from './components/Routes/ProtectedRoute'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UsersPage from './pages/UsersPage';

import RequireRole from './components/Routes/RequireRole' // 👈 agregado
import { AuthProvider } from './context/AuthContext' // 👈 agregado

import ForbiddenPage from './pages/ForbiddenPage';
import UserDashboard from './pages/UserDashboardPage';
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
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/crear-ticket" element={
            <ProtectedRoute>
              <RequireRole allow={["user", "admin", "super_admin"]}>
                <CreateTicketPage />
              </RequireRole>
            </ProtectedRoute>
          } />
          <Route path="/kanban" element={
            <ProtectedRoute>
              <RequireRole allow={["admin", "super_admin"]}>
                <KanbanPage />
              </RequireRole>
            </ProtectedRoute>
          } />
          <Route path="/inbox" element={
            <ProtectedRoute>
              <RequireRole allow={["admin", "super_admin"]}>
                <InboxPage />
              </RequireRole>
            </ProtectedRoute>
          } />
          <Route path="/admin_usuarios" element={
            <ProtectedRoute>
              <RequireRole allow={["admin", "super_admin"]}>
                <UsersPage />
              </RequireRole>
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/kanban" />} />
          <Route path="*" element={<Navigate to="/kanban" />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/mi-usuario" element={<UserDashboard />} />
        </Routes>
        {/* </TicketNotificationProvider> */}
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
