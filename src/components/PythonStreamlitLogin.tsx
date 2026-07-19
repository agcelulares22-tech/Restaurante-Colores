import React, { useRef, useState } from 'react';
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import ElPatronLogo from './ElPatronLogo';
import { Usuario } from '../types';
import { INITIAL_USUARIOS } from '../data/initialData';
import { canLogin, getLoginErrorMessage } from '../lib/loginAuth';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import {
  findDemoLoginUser,
  getConfiguredDemoCredentials,
  isDemoLoginEnabled,
} from '../lib/demoLogin';
import DiagnosticsTester from './DiagnosticsTester';


interface PythonStreamlitLoginProps {
  onLoginSuccess: (user: Usuario) => void;
  onBackToCover?: () => void;
}

const getRuntimeEnv = (): Record<string, unknown> => (
  ((import.meta as { env?: Record<string, unknown> }).env) ?? {}
);

const getDemoUsers = (): Usuario[] => {
  const configuredCredentials = getConfiguredDemoCredentials(getRuntimeEnv());
  if (!configuredCredentials) return INITIAL_USUARIOS;

  return [
    {
      ...INITIAL_USUARIOS[0],
      nombre: 'Demo',
      apellido: 'Admin',
      username: configuredCredentials.username,
      password: configuredCredentials.password,
    },
  ];
};

export default function PythonStreamlitLogin({ onLoginSuccess, onBackToCover }: PythonStreamlitLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const loginInFlightRef = useRef(false);


  const completeLogin = async (user: Usuario) => {
    const lastLogins = JSON.parse(localStorage.getItem('colores_last_logins') || '{}');
    lastLogins[user.username] = new Date().toISOString();
    localStorage.setItem('colores_last_logins', JSON.stringify(lastLogins));

    await new Promise(resolve => setTimeout(resolve, 300));
    onLoginSuccess(user);
  };

  const handleLogin = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (loginInFlightRef.current) return;

    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña.');
      return;
    }

    loginInFlightRef.current = true;
    setIsLoggingIn(true);

    try {
      const demoEnabled = isDemoLoginEnabled(getRuntimeEnv());
      const demoUser = findDemoLoginUser(getDemoUsers(), email, password, demoEnabled);

      if (demoUser) {
        if (!canLogin(demoUser)) {
          setError('Este usuario está desactivado.');
          return;
        }
        await completeLogin(demoUser);
        return;
      }

      const supabase = tryGetActiveSupabaseClient();
      if (!supabase) {
        setError(demoEnabled ? 'Usuario o contraseña incorrectos.' : 'Acceso demo desactivado. Iniciá con Supabase Auth.');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        setError('No pudimos validar la sesión. Intentá nuevamente.');
        return;
      }

      let profile = null;
      let profileError = null;

      try {
        const { data: profileById, error: errById } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id_usuario', authData.user.id)
          .maybeSingle();

        if (profileById) {
          profile = profileById;
        } else {
          const { data: profileByEmail, error: errByEmail } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', authData.user.email)
            .maybeSingle();
          profile = profileByEmail;
          profileError = errByEmail;
        }
      } catch (err) {
        console.warn('Profile fetch error, using email fallback:', err);
      }

      if (profileError) throw profileError;

      if (!profile) {
        setError('Tu cuenta no tiene un perfil operativo asignado.');
        return;
      }

      if (!canLogin(profile as Usuario)) {
        setError('Este usuario está desactivado.');
        return;
      }

      await completeLogin(profile as Usuario);
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      loginInFlightRef.current = false;
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden" id="pos-login-container">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-yellow/10 blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-orange/10 blur-3xl" />

      <div className="max-w-md w-full bg-zinc-950/85 backdrop-blur-md rounded-3xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 md:p-10 space-y-8 relative z-10">
        <div className="text-center space-y-4 flex flex-col items-center">
          <ElPatronLogo className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" variant="badge" color="#E8B800" />
          <div className="space-y-1">
            <h1 className="text-3xl font-display uppercase tracking-wider text-brand-yellow">Colores Pizzería Pro</h1>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
              Sistema Gestor Gastronómico
            </p>
          </div>
          <p className="text-xs text-zinc-400 font-medium max-w-[280px]">
            Control operativo de cocina, salón, caja e inventario.
          </p>
        </div>

        {isLoggingIn ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn" aria-live="polite">
            <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-white text-sm">Iniciando sesión...</h3>
              <p className="text-[11px] text-zinc-500">Preparando el sistema</p>
            </div>
          </div>
        ) : (
          <form className="space-y-4 pt-2" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label htmlFor="login-identifier" className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Usuario o email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ingresá tu usuario o email"
                  className="w-full py-3 pl-10 pr-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-yellow/20 focus:border-brand-yellow transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full py-3 pl-10 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-yellow/20 focus:border-brand-yellow transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 py-2 px-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-brand-red font-medium" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 px-4 bg-brand-yellow hover:bg-[#F2C200] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-brand-black font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-yellow/10"
            >
              <span>Iniciar sesión</span>
              <ArrowRight className="w-5 h-5 text-brand-black" />
            </button>
            
            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowDiagnostics(true)}
                className="text-xs font-semibold text-zinc-500 hover:text-brand-yellow hover:underline transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                🔧 ¿Problemas de conexión? Ejecutar diagnóstico
              </button>
              {onBackToCover && (
                <button
                  type="button"
                  onClick={onBackToCover}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto mt-2"
                >
                  🍕 Volver a la Portada Publicitaria
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {showDiagnostics && (
        <DiagnosticsTester onClose={() => setShowDiagnostics(false)} />
      )}

      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-zinc-600">
        Colores Pizzería • Terminal POS Autorizada
      </div>
    </div>
  );
}
