import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/logo_horizontal.svg';
import Collage from '../assets/COLLAGE_MLM.webp';
import AppVersion from '../components/ui/AppVersion';
import { getSession, signInWithPassword } from '../utils/auth';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // const location = useLocation() as ReturnType<typeof useLocation> & {
  //   state?: { from?: { pathname?: string } }
  // };

  type SessionUser = { id: string };

  async function resolveUserRoleFromDB(
    sessionUser: SessionUser
  ): Promise<string | null> {
    const userId = sessionUser?.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('rol_id, roles(name)')
      .eq('id', userId)
      .single();

    if (error) return null;
    type UserWithRole = { rol_id: number; roles: { name: string } };
    const userWithRole = data as unknown as UserWithRole | null;
    const roleName = userWithRole?.roles?.name ?? null;

    return roleName ? String(roleName).trim().toLowerCase() : null;
  }

  useEffect(() => {
    (async () => {
      const { data } = await getSession();
      const user = data.session?.user;
      if (user) {
        const role = await resolveUserRoleFromDB({ id: user.id });
        navigate(role === 'user' ? '/mi-perfil' : '/kanban', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data, error } = await signInWithPassword(email.trim(), password);
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        setError(
          msg.includes('invalid login credentials')
            ? 'Correo o contraseña incorrectos.'
            : error.message || 'No se pudo iniciar sesión.'
        );
        return;
      }

      if (data.session?.user) {
        const role = await resolveUserRoleFromDB({ id: data.session.user.id });
        navigate(role === 'user' ? '/mi-perfil' : '/kanban', { replace: true });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error inesperado al iniciar sesión'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // const handleForgotPassword = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   setError('Recuperación de contraseña no implementada.');
  // };

  return (
    <div className="flex h-[100dvh]">
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <img src={Logo} alt="MLM Logo" className="h-8 w-auto" />
            <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
              Manteniendo la Misión
            </h2>
          </div>

          <div className="mt-6 sm:mt-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Correo electrónico
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Contraseña
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>

              {/* <div className="flex items-center justify-between">
                <div className="text-sm/6">
                  <a href="#" onClick={handleForgotPassword} className="font-semibold text-indigo-600 hover:text-indigo-500">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div> */}

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
                >
                  {submitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Desarrollado por{' '}
              <a
                href=""
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Innovación & Desarrollo CILM
              </a>
            </p>
            <AppVersion className="text-center mt-4" />
          </div>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          alt="Collage MLM"
          src={Collage}
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  );
}
