import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateTicketPage from './pages/CreateTicketPage'
import KanbanPage from './pages/KanbanPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/Routes/ProtectedRoute'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-ticket" element={<CreateTicketPage />} />
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
