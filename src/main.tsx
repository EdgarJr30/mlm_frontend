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
        <Route path="/crear-ticket" element={<CreateTicketPage />} />
        <Route path="/kanban" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/inbox" element={
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/kanban" />} />
        <Route path="*" element={<Navigate to="/kanban" />} />
      </Routes>
      {/* </TicketNotificationProvider> */}
    </BrowserRouter>
  </React.StrictMode>,
)
