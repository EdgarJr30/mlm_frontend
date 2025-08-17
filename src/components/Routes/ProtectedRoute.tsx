import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../../utils/auth';
import Spinner from '../ui/Spinner';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getSession();
        if (!active) return;
        setOk(Boolean(data.session));
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="h-screen w-screen grid place-items-center">
        <Spinner />
      </div>
    );
  }

  return ok ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
