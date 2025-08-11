// components/Routes/AutoHome.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AutoHome() {
  const { loading, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    navigate(role === "user" ? "/mi-usuario" : "/kanban", { replace: true });
  }, [loading, isAuthenticated, role, navigate]);

  return null; // puedes poner un spinner si te gusta
}
