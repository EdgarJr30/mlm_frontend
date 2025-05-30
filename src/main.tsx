import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import CreateTicketPage from './pages/CreateTicketPage'
import KanbanPage from './pages/KanbanPage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/create-ticket" element={<CreateTicketPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="*" element={<Navigate to="/create-ticket" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
