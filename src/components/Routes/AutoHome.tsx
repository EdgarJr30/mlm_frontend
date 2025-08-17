// components/Routes/AutoHome.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function AutoHome() {
  const { loading, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (!role) return;
    navigate(role === 'user' ? '/mi-perfil' : '/kanban', { replace: true });
  }, [loading, isAuthenticated, role, navigate]);

  return (
    <div className="h-screen w-screen grid place-items-center">
      <Spinner />
    </div>
  );
}
