import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateTicketPage from './pages/CreateTicketPage'
import KanbanPage from './pages/KanbanPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/Routes/ProtectedRoute'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

if (process.env.NODE_ENV !== 'development') {
  // Vacía todos los logs en producción
  console.log = function () { };
  console.warn = function () { };
  console.error = function () { }; // Puedes decidir si ocultar errores o no
}

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/crear-ticket" element={<CreateTicketPage />} />
        <Route path="/kanban" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/kanban" />} />
        <Route path="*" element={<Navigate to="/kanban" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
