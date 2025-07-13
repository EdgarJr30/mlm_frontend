import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, isAuthenticated } from "../utils/fakeAuth";
import Logo from '../assets/logo_horizontal.svg';
import Collage from '../assets/COLLAGE_MLM.webp';
import AppVersion from "../components/ui/AppVersion";

export default function LoginPage() {
  //   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Si ya está logueado, manda directo a /kanban
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/kanban", { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí podrías pedir también el captcha, pero solo lo dejo como referencia:
    // if (!import.meta.env.DEV && !captchaToken) {
    //   setError("Completa el captcha");
    //   return;
    // }
    if (login(password)) {
      navigate("/kanban", { replace: true });
    } else {
      setError("Contraseña incorrecta");
    }
  };

  // Olvidaste tu contraseña (solo fake)
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("Funcionalidad no implementada");
  };

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
            <div>
              <form onSubmit={handleLogin} className="space-y-6">
                {/* <div>
                  <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
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
                </div> */}

                <div>
                  <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
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

                <div className="flex items-center justify-between">
                  <div className="text-sm/6">
                    <a
                      href="#"
                      onClick={handleForgotPassword}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Olvidaste tu Contraseña?
                    </a>
                  </div>
                </div>
                {/* Captcha */}
                <div>
                  {/* {!import.meta.env.DEV && <TurnstileCaptcha onSuccess={setCaptchaToken} />} */}
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </form>
              <p className="mt-10 text-center text-sm/6 text-gray-500">
                Desarrollado por{" "}
                <a href="" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Innovación & Desarrollo CILM
                </a>
              </p>
              <AppVersion className="text-center mt-4" />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            </div>
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
